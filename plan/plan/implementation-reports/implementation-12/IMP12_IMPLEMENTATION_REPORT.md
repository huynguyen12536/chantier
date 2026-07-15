# IMP12_IMPLEMENTATION_REPORT.md

**Date:** 2026-07-15  
**Phase:** Imp-12 Wave A — Compatibility Layer  
**Commit:** `a706e1111f`  
**Result:** PASS  
**Human review:** **APPROVED — Wave A COMPLETE** (see `IMP12_WAVE_A_REVIEW.md`)

---

## Decisions applied

| DR | Value |
|---|---|
| DR-IMP12-001 | A — dual Edge + RPC `/rest/v1` alias |
| DR-IMP12-002 | C — Wave A only |
| DR-IMP12-003 | C — no declarations write adapter |
| DR-IMP12-004 | B — no auth adapter |

---

## Delivered adapters

| Compat path | Calls (in-process) | Mapper |
|---|---|---|
| `POST /functions/create-user` | `usersService.createUser` | `edgeUserMapper` |
| `POST /functions/v1/create-user` | same | same |
| `POST /functions/delete-user` | `usersService.deleteUser` | `edgeUserMapper` |
| `POST /functions/v1/delete-user` | same | same |
| `POST /rpc/delete_chantier_cascade` | `chantiersService.deleteChantierCascade` | `chantierMapper` |
| `POST /rest/v1/rpc/delete_chantier_cascade` | same | same |
| `GET /tables/profiles` (+ `/:id`, `?id=`) | `listUsers` / `getUser` | `profileMapper` |
| `PATCH /tables/profiles` (+ `/:id`) | `updateUser` (Imp-11) | `profileMapper` |

**Module root:** `api-chantier/src/modules/compat/`  
**Mount:** `mountCompat(app)` in `app.js` — additive only.

Architecture: route → controller → **existing service** → mapper → response. No internal HTTP. No service edits Imp-02…11.

---

## Explicitly not delivered (Wave A)

- Wave B table adapters (chantiers, affectations, zones, periods, …)
- declarations UPDATE adapter
- Auth / GoTrue / session compatibility
- Realtime protocol bridge
- SQL / migrations / FE changes

---

## Tests

**80/80 PASS** — see `IMP12_TEST_REPORT.md` / `IMP12_REGRESSION_REPORT.md`.

---

## Closure

**Imp-12 Wave A is COMPLETE.** Do **not** begin Wave B without new Human authorization.
