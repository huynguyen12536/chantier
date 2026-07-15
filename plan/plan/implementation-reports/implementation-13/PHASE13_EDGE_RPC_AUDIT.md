# PHASE13_EDGE_RPC_AUDIT.md

**Date:** 2026-07-15  
**Evidence-only**

---

## 1. Edge / functions.invoke

| Pattern | Count in FE app |
|---|---|
| `functions.invoke(` | **0** |
| Raw `fetch(\`${supabaseUrl}/functions/v1/...\`)` | **YES** |

### Live UI call sites

| File | Function | Endpoint | Headers / body (evidence) |
|---|---|---|---|
| `management.tsx` ~456 | create-user | `${supabaseUrl}/functions/v1/create-user` | Bearer `session.access_token`, `apikey: supabaseAnonKey`, JSON user fields |
| `management.tsx` ~580 | delete-user | `.../functions/v1/delete-user` | Bearer + body `{ user_id }` |
| `admin-users.tsx` ~232 | create-user | same | same pattern |
| `admin-users.tsx` ~149 | delete-user | same | same |

### Script (not UI)

| File | Endpoint |
|---|---|
| `scripts/create-test-users.ts` | `${VITE_SUPABASE_URL}/functions/v1/create-user` with anon Bearer |

### Edge implementations (Deno under `supabase/functions/` — not FE)

| Folder | FE calls? |
|---|---|
| `create-user/` | **YES** (via URL above) |
| `delete-user/` | **YES** |
| `seed-test-users/` | **NO** (UI does not call) |

### Imp-12 coverage

| Edge | Covered? |
|---|---|
| create-user | **YES** — Imp-12 `POST /functions[/v1]/create-user` → Imp-03/11 |
| delete-user | **YES** — Imp-12 dual → Imp-03 |
| seed-test-users | **Dead for UI** — no Imp-12 adapter required for FE cutover |

---

## 2. RPC

| RPC name | Status | File(s) | Body |
|---|---|---|---|
| `delete_chantier_cascade` | **ACTIVE** | `management.tsx` ~811; `admin-worksites.tsx` ~196 | `{ p_chantier_id: ... }` |
| `auto_approve_week_suggestion_replication` | **COMMENTED** | `utils/ouvrierDeclaration.ts` ~250 | Dead / inactive |

### Imp-12 coverage

| RPC | Covered? |
|---|---|
| `delete_chantier_cascade` | **YES** — Imp-12 `/rpc` + `/rest/v1/rpc` → Imp-04 |
| auto_approve week | **Dead code** — OUT; Imp-12 OUT |

---

## 3. Response shapes (Edge FE expectations)

From FE handling of create-user responses (management/admin-users): expects JSON with success/error fields compatible with Edge function (Imp-12 Wave A maps `{ success, user }` / `{ error }`).

RPC FE only checks `error` from supabase.rpc.
