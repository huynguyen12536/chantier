# IMP12_IMPLEMENTATION_SCOPE.md

**Date:** 2026-07-15  
**Phase:** Imp-12 — Compatibility Layer only  
**Prerequisite:** Imp-02 → Imp-11 COMPLETE (LOCKED SoT). Imp-11 Administration FINAL.

---

## Mission

Provide **compatibility adapters** so the **frozen CVL frontend** can target the Unified backend.

```
Old FE Contract  →  Imp-12 Adapter  →  Existing Unified REST/Service
```

Imp-12 does **not** implement business.  
Final backend remains **CVL capability ∪ Unified backend** (not clone, not rewrite).

---

## IN — Category 6 only

| Item | Maps to | Consume (REUSE) |
|---|---|---|
| `POST /functions/create-user` (+ FE-live `/functions/v1/create-user` if DR-001) | `POST /api/users` | Imp-03/11 users service |
| `POST /functions/delete-user` (+ `/functions/v1/…`) | `DELETE /api/users/:id` | Imp-03 users service |
| `POST /rpc/delete_chantier_cascade` | `DELETE /api/chantiers/:id` | Imp-04 `deleteChantierCascade` |
| `/tables/profiles` GET/PATCH (allow-list) | `/api/users` + `PATCH /api/users/:id` | Imp-03/11 |
| Allow-list `/tables/*` for other **7** FE contract tables **if approved in Wave B** | Matching Imp-04…07 REST | Existing services only |
| Edge/RPC/table **response envelope** translation | — | Thin mappers only |
| Compatibility tests only | Old request → adapter → existing stack | No new unit business tests for Imp-04…11 |
| Imp-12 documentation / reports | — | This pack |

**Allowed code locations (proposed):** new module tree only, e.g. `api-chantier/src/modules/compat/` (or `adapters/`). Wire mounts in `app.js` **as additional routes** — do not edit Imp-02…11 module service/repository/validation files.

---

## OUT — Not Imp-12

| Item | Owner |
|---|---|
| Authentication / JWT / refresh **business** | Imp-02 |
| Users create/delete/list **business** | Imp-03 |
| Chantiers cascade **business** | Imp-04 (already) |
| Affectations / zones **business** | Imp-05 |
| Timesheets / sync **business** | Imp-06 |
| Reviews / audit transitions **business** | Imp-07 |
| Export payroll **business** | Imp-08 |
| Realtime SSE semantics | Imp-09 (CLOSED) |
| Administration PATCH / role lifecycle / phone / matricule UNIQUE | Imp-11 FINAL |
| FE source changes under `chantier1/` | Frozen |
| Super Admin / multi-company / Flow H | Project Decision Log Deferred |
| Active enable of commented week auto-approve RPC | Inactive contract |

---

## FORBIDDEN

| Forbidden | Why |
|---|---|
| Modify Imp-02…Imp-11 business, validation, role logic, auth, permissions | Ownership lock |
| Any SQL migration / ALTER / CREATE / DROP / INDEX | Imp-12 DB policy |
| Rewrite previous migrations | Wave policy |
| Duplicate create/delete/demotion/cascade logic in adapters | No business duplication |
| Invent new permissions or transactions | Translate only |
| Full PostgREST clone / schema redesign | Design constraint |
| FE modifications | Freeze |

---

## REUSE

| Imp | What adapters call |
|---|---|
| Imp-02 | `requireAuth`, JWT verification, session identity for Bearer |
| Imp-03 | `createUser`, `deleteUser`, list/get users |
| Imp-04 | Chantiers CRUD + `deleteChantierCascade` |
| Imp-05 | Affectations + zones service APIs |
| Imp-06 | Periods / declarations read-write services |
| Imp-07 | Validation decide/approve/reject/cancel as needed for declaration status updates |
| Imp-08 | Export only if table adapter wrongly targeted — prefer existing `/api/export` (table adapter N/A for export screen’s `.from` reads → periods adapter) |
| Imp-09 | Do not reimplement SSE; do not touch unless Human expands Realtime protocol bridge |
| Imp-11 | `updateUser` for profiles PATCH alias |

---

## DEFERRED / gated by Imp-12 DRs

| Item | Gate |
|---|---|
| Dual path prefixes (`/functions` vs `/functions/v1`, `/tables` vs `/rest/v1`) | **DR-IMP12-001** |
| Wave B full 8-table allow-list vs Wave A Admin-only subset | **DR-IMP12-002** |
| Declaration UPDATE → Imp-07 command mapping | **DR-IMP12-003** |
| Auth session adapter (GoTrue / openapi `/auth/session`) | **DR-IMP12-004** |
| Supabase Realtime protocol bridge | Deferred (Imp-09 transport already exists) |

---

## Success criteria (post-approval coding)

- Frozen FE contract surfaces listed IN have adapters.
- No business duplication; no Imp-02…11 source rewrite; no DB change.
- Compatibility tests green for Edge + RPC (+ approved tables).
- Reports: TEST + REGRESSION + IMPLEMENTATION.

Coding remains **blocked** until DRs in `IMP12_DECISION_LOG.md` are answered or waived.
