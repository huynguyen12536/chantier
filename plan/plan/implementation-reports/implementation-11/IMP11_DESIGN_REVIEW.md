# IMP11_DESIGN_REVIEW.md

**Date:** 2026-07-15  
**Mode:** Phase 2 — Design review of **existing** implementation (`2d3ddaed70`)  
**Input:** `IMP11_IMPLEMENTATION_INVESTIGATION.md` · prior `IMP11_DECISION_LOG.md` · WAVE2 · ADR-001 · `02_SINGLE_WRITE_PATH.md` · merge SoT  
**No production code.**

---

## Method

Compare **Expected** (SoT + sealed Imp-11 DRs) vs **Actual** (code on main). Do not invent new architecture.

---

## DR-IMP11-001 — REST admin vs Imp-12 adapters

| | |
|---|---|
| **Expected** | Imp-11 owns REST Administration; Imp-12 owns Edge/RPC/table aliases |
| **Actual** | `PATCH /api/users/:id` in `users` module; no `/functions` in Imp-11 commit |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep sealed. No change. |

---

## DR-IMP11-002 — Additive phone + nonempty matricule UNIQUE

| | |
|---|---|
| **Expected** | Exactly one additive migration; no rewrite of prior migrations |
| **Actual** | `010_imp11_admin_profiles.sql` — `phone` NOT NULL DEFAULT `''`; partial unique index on nonempty matricule |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep sealed. |

---

## DR-IMP11-003 — Admin audit surface

| | |
|---|---|
| **Expected** | Structured application logs only (no new audit table) |
| **Actual** | `logger.info('admin.user.created|updated|deleted', …)` |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep sealed. Imp-13/ops may later add sinks — out of Imp-11. |

---

## DR-IMP11-004 — nom/prenom validation

| | |
|---|---|
| **Expected** | Service-level validation on admin create/PATCH |
| **Actual** | Zod `nonEmptyName` on create + optional on PATCH |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep sealed. |

---

## Architecture decision — Demotion guards ownership

| | |
|---|---|
| **Expected** | Imp-11 enforces guards; Imp-05 owns affectation/zone business (READ only) |
| **Actual** | `assertDemotionAllowed` + `hasActiveChefAffectation` / `ownsZone` SELECT only |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep. Do not move writes into Imp-05 from Imp-11. |

---

## Architecture decision — Single profile write path

| | |
|---|---|
| **Expected** | Controllers/jobs invoke identity commands; no competing profile writers for admin update |
| **Actual** | Admin PATCH → `updateUser` → `updateProfile`; create/delete remain Imp-03 service methods same module |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep. |

---

## Architecture decision — RBAC for PATCH

| | |
|---|---|
| **Expected** | Admin lifecycle delete/edit privileged; administratif may create (permissions_mapping) |
| **Actual** | PATCH/DELETE `requireRoles('admin')`; POST allows administratif |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep. |

---

## Architecture decision — Promote → affectation sync (G-04)

| | |
|---|---|
| **Expected** | CVL sync often FE-driven; Imp-11 may omit server auto-sync if documented |
| **Actual** | No auto-update of `affectations_chantiers.chef_equipe_id` on promote |
| **Pass/Fail** | **PASS** (accepted omission) |
| **Recommendation** | **Do not implement** in Imp-11 closure process unless Human opens a new DR. Treat as accepted debt / Imp-05 adjacency. |

---

## Architecture decision — Super Admin

| | |
|---|---|
| **Expected** | Absent (Decision Log Deferred) |
| **Actual** | Absent |
| **Pass/Fail** | **PASS** |
| **Recommendation** | Keep deferred. |

---

## Design review verdict

| Result | Detail |
|---|---|
| **OVERALL** | **PASS** |
| Code redesign | **Not required** |
| New features | **Not required** |
| DR reopen | **Not required** |

Proceed to Phase 3 Implementation Review.
