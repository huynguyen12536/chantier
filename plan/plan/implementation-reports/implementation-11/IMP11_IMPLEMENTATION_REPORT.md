# IMP11_IMPLEMENTATION_REPORT

**Date:** 2026-07-15  
**Module:** Imp-11 Administration  
**Status:** PASS (awaiting human review)  
**Mode:** UNION MERGE (CVL Admin ∪ Unified Imp-02→09)

---

## 1. Summary

Imp-11 delivers Administration Cat 3–5 without rewriting Imp-04–09:

| Category | Delivered |
|---|---|
| 3 REST | `PATCH /api/users/:id` |
| 4 Additive SQL | `010_imp11_admin_profiles.sql` — `phone` + nonempty `matricule` UNIQUE |
| 5 Admin business | Promote/demote, demotion guards (READ Imp-05), admin role lock, nom/prenom validation, structured logs |

Closed DRs applied: REST=Imp-11 / adapters=Imp-12; additive phone+matricule; logs-only audit; service nom/prenom validation.

---

## 2. Code

| Path | Change |
|---|---|
| `migrations/010_imp11_admin_profiles.sql` | New additive only |
| `modules/users/repository.js` | Thin SQL + Imp-05 ownership READ |
| `modules/users/service.js` | create (phone/prenom), updateUser, demotion |
| `modules/users/controller.js` / `routes.js` | PATCH admin |
| `modules/auth/service.js` | `publicProfile.phone` in DTO selects |
| `test/admin.users.test.js` | Imp-11 cases |
| `test/users.test.js` | prenom/phone on create |

**Untouched business:** Imp-04/05/06/07/08/09 modules (Imp-05 tables read-only for guards).

---

## 3. Tests

| Suite | Result |
|---|---|
| Full `node --test --test-concurrency=1 test/**/*.test.js` | **76/76 PASS** |
| Imp-11 admin.users | PATCH, promote, demote affectation/zone, role lock, demote ok |
| Regression Imp-01→Imp-09 | PASS |

---

## 4. Final validation

| Check | Result |
|---|---|
| CVL Admin capabilities preserved (create/delete/edit/role/phone/guards) | ✓ |
| Unified-native kept (`password_hash`, refresh, `actif`) | ✓ |
| Previous Imp ownership respected | ✓ |
| Exactly one new migration | ✓ `010_…` |
| No prior migration edited | ✓ |
| No Imp-04…09 rewrite / no FE / no Edge adapters | ✓ |

---

## 5. Out of scope (unchanged)

Edge `/functions/*`, RPC aliases, Super Admin, FE — Imp-12 / Decision Log.
