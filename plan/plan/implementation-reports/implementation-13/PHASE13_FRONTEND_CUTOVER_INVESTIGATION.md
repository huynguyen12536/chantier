# PHASE13_FRONTEND_CUTOVER_INVESTIGATION.md

**Date:** 2026-07-15  
**Mode:** Investigation ONLY — no production code  
**Goal:** Replace Supabase cloud runtime with local Unified stack under frozen-FE constraints.

---

## 1. Target transport chain

```
Expo / Web FE
    │  (today: @supabase/supabase-js + Cloud URL)
    ▼
Compatibility Layer  (Imp-12 mountCompat)
    │  /auth/v1  /functions[/v1]  /rpc  /rest/v1/{table}  /tables/{table}
    ▼
Unified Backend services  (Imp-02…11)
    ▼
Local PostgreSQL
```

Realtime (today): Supabase channel → **must become** Imp-09 SSE **or** a new protocol bridge (open DR).

---

## 2. Cutover strategies (candidates — Design Review later)

| Strategy | Idea | FE edits? | Compat work? |
|---|---|---|---|
| **S1 — URL redirect only** | Point `EXPO_PUBLIC_SUPABASE_URL` at local API; keep supabase-js | Minimal env | **Requires near-PostgREST + GoTrue + Realtime fidelity** — largely **absent** |
| **S2 — Thin FE client swap** | Replace supabase calls with fetch to Imp-12 paths (and EventSource `/events`) | **Yes** (thaw FE) | Reuse Imp-12 adapters as-is |
| **S3 — Hybrid** | Env → local API for Edge/RPC/auth; progressive table REST; SSE adapter in FE | **Yes** (scoped) | Possible Imp-12/09 extensions |

**Investigation finding:** **S1 alone is not sufficient** given Imp-12 sealed limitations and supabase-js protocol expectations. Phase 13 Design must choose S2 or S3 (or expand compat under new DRs).

Historical “FE frozen” rule conflicts with S2/S3. **Requires Human DR** (see `PHASE13_DECISION_LOG.md`).

---

## 3. Transport map by category

### 3.1 Auth

| FE behavior | Compat path | Gap |
|---|---|---|
| Password login | `POST /auth/v1/token?grant_type=password` | supabase-js expects GoTrue session JSON + user shape; Imp-12 maps `access_token`/`refresh_token` — **parity unproven with supabase-js** |
| Refresh | `grant_type=refresh_token` | Auto-refresh inside supabase-js must hit GoTrue paths (`/auth/v1/token`) — path naming may work if client aims at base URL |
| Logout | Local clear vs `POST /auth/v1/logout` | FE uses `scope: 'local'` — no server revoke today; OK for local cutover |
| `getSession` / `onAuthStateChange` | Persistence in supabase-js storage | Works only if tokens stored as Session; **may need FE storage adapter** if client discarded |
| Profile load | `GET /rest/v1/profiles?id=eq…` or `/auth/v1/user` | Profiles GET exists; **PostgREST `eq` filter grammar not in Imp-12** — FE uses `.eq('id', userId)` |

**Conclusion:** Switching completely to `/auth/v1` **without** changing FE auth code is **uncertain / likely BLOCKED**. Thin adapter exists for direct HTTP; supabase-js integration needs Design.

### 3.2 Edge / RPC

| FE | Compat | Gap |
|---|---|---|
| `fetch(.../functions/v1/create-user)` | Imp-12 Edge dual | **READY** if base URL → local API and Bearer is Unified JWT |
| `fetch(.../functions/v1/delete-user)` | Imp-12 | **READY** (same) |
| `rpc('delete_chantier_cascade')` | Imp-12 `/rest/v1/rpc/...` | **READY** if supabase-js RPC POST body matches `{ p_chantier_id }` |

### 3.3 Tables

| Verb class | Imp-12 | Gap vs FE |
|---|---|---|
| Simple list/get | Partial | FE uses PostgREST query params (`eq`, `or`, `in`, `lte`, embeds) — **compat allow-list only** |
| Nested selects | Missing | e.g. `zones_ouvriers` → `zones_chantiers(chantiers(...))` in AuthContext |
| Declarations UPDATE | Missing | B-003=C — **Flow E validation UI blocked** |
| Affectations upsert | Partial | B-005=B — POST assignUser only |
| zones_chantiers SELECT | Missing list | Management loadZones |
| Export SELECT-heavy | Partial | May work for simple lists if filters map |

### 3.4 Realtime

| Today | Unified | Gap |
|---|---|---|
| `.channel().on('postgres_changes')` | Imp-09 `GET /events` SSE | **Protocol mismatch** — FE does not speak SSE today |

Options (investigation only): (A) FE EventSource adapter to `/events`; (B) Supabase Realtime protocol bridge server; (C) degrade to poll/reload. **B was OUT of Imp-12.** A implies FE thaw.

### 3.5 Storage

N/A — no FE storage. No cutover work.

---

## 4. Business logic reuse

**Do not redesign.** All writes must continue:

- Imp-02 auth services  
- Imp-04…07 table/command services  
- Imp-08 export (if later adopted)  
- Imp-09 SSE publish  
- Imp-11 admin PATCH  

Adapters remain translators only. Expanding PostgREST fidelity is still “compat layer” work, not domain rewrite.

---

## 5. Hard-cut prerequisite checklist

| # | Prerequisite | Status |
|---|---|---|
| 1 | Local API + DB running with migrations | READY (Compose today) |
| 2 | FE env points at local API | BLOCKED — hardcoded cloud in `app.config.js` + freeze policy |
| 3 | Auth session works end-to-end | BLOCKED — supabase-js vs `/auth/v1` fidelity |
| 4 | Table ops used by critical flows | BLOCKED — grammar / embeds / declaration writes |
| 5 | Realtime UX | BLOCKED — protocol |
| 6 | Edge/RPC admin flows | READY (compat exists) |
| 7 | Seed users for local demo | BLOCKED — no official local seed pack |
| 8 | CORS for Expo web / LAN | READY enough (`CORS_ORIGIN`) — verify Design |

---

## 6. Explicit non-goals (this investigation)

- ETL / production cloud cutover  
- Super Admin / multi-company  
- Inventing storage  
- Imp-10 Wave C  
- Auto-rewriting Imp-02…11 business  

---

## 7. STOP

Cutover path exists in principle (compat + Unified + local Postgres).  
**Executable product cutover is blocked** until DRs resolve FE thaw, Realtime, declarations writes, and query-fidelity strategy.

Await Human Review → Design Review.
