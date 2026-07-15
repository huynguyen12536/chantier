# IMP12_FE_CONTRACT_MATRIX.md

**Date:** 2026-07-15  
**Status:** **FINAL** — Imp-12 **COMPLETE** (`d8bb5c83c0`)  
**Release:** **APPROVED** · Seal: `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`  
**SoT:** `migration-analysis/` + Imp-11 locked pack + frozen FE under `chantier1/`  
**Layer:** Compatibility only (translate Old FE Contract → Unified REST). No new business.

> Matrix rows originally drafted at investigation. Delivered Wave A/B outcomes noted in Status column where updated.

---

## Legend

| Column | Meaning |
|---|---|
| Old FE | Observable CVL FE call (file evidence) |
| Adapter (proposed) | Imp-12 HTTP surface |
| Unified REST | Existing Imp-02…11 route (unchanged) |
| Existing Service | Module service function to invoke (REUSE) |
| Response shape | FE-facing envelope |
| Status | Ready / Needs DR / Out of Imp-12 |

---

## A. Edge Function aliases (Category 6 — Core Imp-12)

| ID | Old FE | Adapter | Unified REST | Existing Service | Response shape (FE) | Status |
|---|---|---|---|---|---|---|
| E-01 | `POST ${supabaseUrl}/functions/v1/create-user` · Bearer + optional `apikey` · body `{ email, password, nom, prenom, phone, role, matricule? }` · `management.tsx` ~453, `admin-users.tsx` | **Primary design path:** `POST /functions/create-user` · **FE-live alias:** `POST /functions/v1/create-user` (same handler) | `POST /api/users` | Imp-03/11 `users/service.createUser` | Edge: `{ success: true, user: { id, email, nom, prenom, matricule, role } }` or `{ error: string }` · map Unified DTO → Edge envelope; do **not** re-validate beyond forwarding | **DELIVERED** (DR-001=A) |
| E-02 | `POST …/functions/v1/delete-user` · body `{ user_id }` · admin · `management.tsx` ~578 | `POST /functions/delete-user` + `POST /functions/v1/delete-user` | `DELETE /api/users/:id` | Imp-03 `users/service.deleteUser` (ZONE_RESTRICT already) | Edge: `{ success: true }` or `{ error: string }` · status 200 on success (Edge) / map Imp-03 codes to Edge-like messages where trivial | **DELIVERED** |
| E-03 | `seed-test-users` Edge | — | — | — | — | **OUT** — not active UI contract (`edge_functions_mapping.md`) |

**Adapter rule:** Pass Bearer through auth middleware (Imp-02). Call existing users service **in-process** (preferred) or internal dispatch — never duplicate create/delete guards.

---

## B. RPC aliases (Category 6 — Core Imp-12)

| ID | Old FE | Adapter | Unified REST | Existing Service | Response shape | Status |
|---|---|---|---|---|---|---|
| R-01 | `supabase.rpc('delete_chantier_cascade', { p_chantier_id })` · `management.tsx` ~811, `admin-worksites.tsx` ~196 | `POST /rpc/delete_chantier_cascade` body `{ p_chantier_id }` · optional alias `POST /rest/v1/rpc/delete_chantier_cascade` if DR chooses PostgREST path parity | `DELETE /api/chantiers/:id` | Imp-04 `chantiers/service.deleteChantierCascade` | PostgREST RPC typically `204` / null data; FE only checks `error` | **DELIVERED** |
| R-02 | `auto_approve_week_suggestion_replication` · **commented** FE | — | — | — | — | **OUT** — inactive contract |

---

## C. Table adapters — allow-list (Category 6)

Design SoT: `/tables/{table}` (`FE_COMPATIBILITY_ADAPTERS.md`, `openapi.yaml`). Live FE uses supabase-js → `/rest/v1/{table}` with PostgREST query grammar.

Adapters **must not** invent RBAC: authorize already lives in Unified services.

### C.1 profiles

| ID | Old FE ops | Adapter | Unified REST | Service | Notes | Status |
|---|---|---|---|---|---|---|
| T-P-01 | SELECT list / by id · AuthContext, management, admin-* | `GET /tables/profiles` (+ filters `id`, `role` as query) · dual `/rest/v1` | `GET /api/users` / `GET /api/users/:id` | `users/service` list/get | Strip `password_hash`; include `phone` (Imp-11) | **DELIVERED** (+ B-002 dual) |
| T-P-02 | UPDATE role/fields · management ~550, admin-users, auth.updateProfile | `PATCH /tables/profiles` or `PATCH /tables/profiles/:id` · body profile row + id | `PATCH /api/users/:id` | Imp-11 `updateUser` | Map row keys → PATCH body; **no new validation** | **DELIVERED** |
| T-P-03 | INSERT profiles | — | — | — | Create only via Edge/REST users | **OUT** (Edge E-01) |

### C.2 chantiers

| ID | Old FE ops | Adapter | Unified REST | Service | Status |
|---|---|---|---|---|---|
| T-C-01 | SELECT | `GET /tables/chantiers` (+ `/rest/v1`) | `GET /api/chantiers` | Imp-04 list | **DELIVERED** |
| T-C-02 | INSERT | `POST /tables/chantiers` | `POST /api/chantiers` | Imp-04 create | **DELIVERED** |
| T-C-03 | UPDATE | `PATCH /tables/chantiers/:id` | `PATCH /api/chantiers/:id` | Imp-04 update | **DELIVERED** |
| T-C-04 | DELETE row | — | via R-01 | Imp-04 cascade | **DELIVERED** via RPC |

### C.3 affectations_chantiers

| ID | Old FE ops | Adapter | Unified REST | Service | Status |
|---|---|---|---|---|---|
| T-A-01 | SELECT | `GET /tables/affectations_chantiers` | `GET /api/affectations` | Imp-05 list | **DELIVERED** |
| T-A-02 | INSERT / UPSERT | `POST /tables/affectations_chantiers` | `POST /api/affectations` | Imp-05 assignUser | **DELIVERED** INSERT via assignUser; upsert invent **DEFERRED (B-005=B)** |
| T-A-03 | UPDATE `date_fin` soft-remove | `PATCH /tables/affectations_chantiers/:id` | `PATCH /api/affectations/:id/soft-remove` | Imp-05 softRemove | **DELIVERED** |

### C.4 zones_equipe / zones_chantiers / zones_ouvriers

| ID | Old FE ops | Adapter | Unified REST | Service | Status |
|---|---|---|---|---|---|
| T-Z-01 | zones_equipe CRUD | `/tables/zones_equipe` | `/api/zones` CRUD | Imp-05 zones | **DELIVERED** |
| T-Z-02 | zones_chantiers insert/delete | `/tables/zones_chantiers` | `POST/DELETE /api/zones/:id/chantiers…` | Imp-05 link/unlink | **DELIVERED** |
| T-Z-03 | zones_ouvriers insert/update | `/tables/zones_ouvriers` | `POST …/ouvriers`, soft-remove | Imp-05 | **DELIVERED** |

### C.5 periodes_travail / declarations_heures

| ID | Old FE ops | Adapter | Unified REST | Service | Status |
|---|---|---|---|---|---|
| T-T-01 | periods SELECT/INSERT/UPDATE/DELETE | `/tables/periodes_travail` | `/api/timesheet/periods` | Imp-06 | **DELIVERED** |
| T-T-02 | declarations SELECT/UPDATE (validate/cancel) | `/tables/declarations_heures` | `/api/timesheet/declarations` + `/api/validation/…` | Imp-06/07 | **GET DELIVERED**; UPDATE **DEFERRED (B-003=C)** |
| T-T-03 | FE INSERT declarations | — | — | — | **OUT** — trigger/sync owned by Imp-06; FE does not insert (tables-used §1) |

---

## D. Auth / Realtime (evidenced — ownership check)

| ID | Old FE | Adapter candidate | Unified | Status |
|---|---|---|---|---|
| A-01 | `auth.signInWithPassword` / session / `onAuthStateChange` | GoTrue-shaped `/auth/v1/...` | `/api/auth/login|refresh|logout|me` Imp-02 | **DELIVERED** thin auth (B-004=A) |
| A-02 | `channel` + `postgres_changes` on periods/declarations | Supabase Realtime protocol vs Imp-09 `GET /events` SSE | Imp-09 SSE | **OUT Imp-12 (B-006=B)** — Imp-09 SoT |

---

## E. Explicit non-goals (not adapters)

| Item | Reason |
|---|---|
| Storage | FE inventory: no `.storage` |
| Super Admin / multi-company | Decision Log Deferred |
| Rewriting Imp-02…11 services | Ownership lock |
| New SQL / migrations | Imp-12 forbids DB |
| Cloning PostgREST grammar fully | Design: “Not a PostgREST clone”; allow-list only |

---

## Coverage summary (vs Human expected examples)

| Human example | Matrix ID | Maps to |
|---|---|---|
| `POST /functions/create-user` → `POST /api/users` | E-01 | Imp-03/11 create |
| `POST /functions/delete-user` → `DELETE /api/users/:id` | E-02 | Imp-03 delete |
| `PATCH /tables/profiles` → `PATCH /api/users/:id` | T-P-02 | Imp-11 update |
| `POST /rpc/delete_chantier_cascade` → DELETE chantier | R-01 | Imp-04 cascade |
| Other FE endpoints if evidenced | C.2–C.5, D | Imp-04…07 + auth DR |

---

## Evidence index

| Evidence | Path |
|---|---|
| FE inventory | `migration-analysis/frontend-supabase-usage.md` |
| Tables | `migration-analysis/tables-used-by-frontend.md` |
| Edge map | `migration-analysis/merge/edge_functions_mapping.md` |
| Contract matrix | `migration-analysis/merge/fe_contract_matrix.md` |
| Design adapters | `migration-analysis/unified/api/FE_COMPATIBILITY_ADAPTERS.md` |
| Design OpenAPI | `migration-analysis/unified/api/openapi.yaml` |
| Imp-11 deferral | `IMP11_IMPLEMENTATION_SCOPE.md` Category 6 |
| Imp-11 FE admin | `IMP11_FE_CONTRACT_REPORT.md` |
| Imp-11 FINAL | `IMP11_IMPLEMENTATION_REPORT.md` |
