# IMP11_IMPLEMENTATION_INVESTIGATION.md

**Date:** 2026-07-15  
**Mode:** Phase 1 — Implementation investigation **ONLY**  
**Code head (existing):** `2d3ddaed70`  
**Authority:** Imp-11 Administration already on `main` — do **not** redesign  

---

## 1. Executive summary

Imp-11 Administration is **already implemented** on main. It adds REST admin lifecycle for profiles (PATCH, role promote/demote with Imp-05 **read** guards), one additive UNION migration (`phone` + nonempty `matricule` UNIQUE), Zod validation for nom/prenom, and structured admin logs. Edge/RPC aliases remain Imp-12. Super Admin remains deferred.

This pack documents what exists for governance parity with Imp-10 — **no production code changes**.

---

## 2. Implemented scope

| Capability | Status | Evidence |
|---|---|---|
| `PATCH /api/users/:id` | Delivered | `routes.js` · `controller.update` · `service.updateUser` |
| Profile field edit (email, nom, prenom, phone) | Delivered | `patchSchema` · `repo.updateProfile` |
| Role promote / demote | Delivered | `updateUser` + `assertDemotionAllowed` |
| Admin role lock (cannot change admin’s role; cannot change own role) | Delivered | service ROLE_LOCK |
| Demotion guard: active affectation chef | Delivered | `hasActiveChefAffectation` READ |
| Demotion guard: zone owner | Delivered | `ownsZone` READ |
| Matricule immutable on PATCH | Delivered | `MATRICULE_IMMUTABLE` |
| Create with phone + required prenom/nom | Delivered | `createSchema` · insert wiring |
| Additive `profiles.phone` | Delivered | `010_imp11_admin_profiles.sql` |
| Nonempty matricule UNIQUE | Delivered | partial unique index |
| Structured logs | Delivered | `admin.user.created/updated/deleted` |
| Tests | Delivered | `test/admin.users.test.js` |

**Not implemented (out of Imp-11 / deferred):**

| Item | Owner |
|---|---|
| Edge create/delete user adapters | Imp-12 |
| Auto-sync `affectations.chef_equipe_id` on promote | Documented gap G-04 — not in `2d3ddaed70` (FE-driven in CVL) |
| Super Admin / multi-company | Decision Log Deferred |
| PATCH `actif` / soft-disable | Not in patch schema — Unified-native field exists; not Imp-11 admin PATCH surface |
| FE under `chantier1/` | Frozen |

---

## 3. Production files (commit `2d3ddaed70`)

| Path | Role |
|---|---|
| `api-chantier/migrations/010_imp11_admin_profiles.sql` | Additive DDL |
| `api-chantier/src/modules/users/service.js` | Admin business (create extend + updateUser + demotion) |
| `api-chantier/src/modules/users/repository.js` | Thin SQL + Imp-05 READ helpers |
| `api-chantier/src/modules/users/controller.js` | PATCH handler |
| `api-chantier/src/modules/users/routes.js` | `PATCH` admin-only |
| `api-chantier/src/modules/auth/service.js` | `publicProfile.phone` + SELECT cols |
| `api-chantier/test/admin.users.test.js` | Imp-11 cases |
| `api-chantier/test/users.test.js` | Create prenom/phone regression tweak |

---

## 4. Migrations

| File | Contents | Policy |
|---|---|---|
| `010_imp11_admin_profiles.sql` | `ADD COLUMN phone TEXT NOT NULL DEFAULT ''`; unique index on nonempty `matricule` | Additive only; no DROP/rewrite of prior migrations |

---

## 5. APIs

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/users` | admin, administratif | Imp-03 (unchanged ownership) |
| GET | `/api/users/:id` | admin, administratif | Imp-03 |
| POST | `/api/users` | admin, administratif | Imp-03 + Imp-11 field/validation extensions |
| **PATCH** | **`/api/users/:id`** | **admin** | **Imp-11** |
| DELETE | `/api/users/:id` | admin | Imp-03 (+ zone guard reuse) |

No Edge `/functions/*` in Imp-11.

---

## 6. Ownership

| Concern | Owner |
|---|---|
| Auth / JWT / password_hash / refresh | Imp-02 |
| User create/list/delete REST baseline | Imp-03 |
| Admin PATCH / role lifecycle / phone UNION / demotion policies | **Imp-11** |
| Affectations / zones **business** | Imp-05 (Imp-11 **READ only**) |
| Edge/RPC FE adapters | Imp-12 |
| Timesheet / review / export / realtime | Imp-06…09 — untouched |

Aligns with ADR-001 **Identity & Access** and WAVE2 Imp-11 goal (CVL-evidenced admin only).

---

## 7. Architecture

```
HTTP PATCH /api/users/:id
  → requireAuth + requireRoles('admin')
  → users.controller.update
  → users.service.updateUser
       → Zod patchSchema
       → matricule immutability
       → role lock + assertDemotionAllowed
            → repo.hasActiveChefAffectation / ownsZone (READ Imp-05)
       → repo.updateProfile (profiles only)
       → logger.info('admin.user.updated')
  → publicProfile DTO (auth)
```

Single profile write path for admin updates: **`users.service.updateUser` → `repository.updateProfile`**. No competing admin write modules.

---

## 8. Risks

| Risk | Severity | Notes |
|---|---|---|
| Promote without affectation chef sync (G-04) | Low–Medium | Mirrors CVL FE-driven sync; not in shipped code |
| Admin-only PATCH vs administratif create | Low | Matches FE management + CVL create roles; documented |
| Unique matricule conflicts (23505) | Low | Mapped to 409 CONFLICT |
| Logs-only audit (no admin_audit table) | Low | DR-IMP11-003 sealed |
| Imp-05 table absent → guards no-op | Low | `to_regclass` defensive; tests assume schema present |

---

## 9. Remaining questions (for Phase 2 / Human)

1. Confirm **no reopen** of DR-IMP11-001…004 (already sealed in prior Decision Log).  
2. Confirm **G-04** (promote → affectation sync) remains **out of Imp-11** (no coding).  
3. Confirm PATCH should **not** expose `actif` in this release.  
4. Confirm Wave/closure process continues like Imp-10 (review → implementation review → later closure) — **not** claiming COMPLETE in this phase.

---

## 10. Prior artifacts (context)

Existing pack under `implementation-reports/implementation-11/`: capability matrix, schema merge, scope, plan, gap analysis, implementation/test/regression reports.

---

```
Phase 1 STOP.
No production code modified.
Await Phase 2 Design Review (this session continues per Human multi-phase authorize).
```
