# IMP11_IMPLEMENTATION_PLAN — Administration (UNION MERGE)

**Date:** 2026-07-15  
**Status:** PLAN ONLY — investigation complete; **no code until DRs + authorize**  
**Formula:** Final Admin = CVL Admin ∪ Unified Imp-02/03(+reuse 04/05)  
**Frozen / reuse-only:** Imp-04, Imp-05, Imp-06, Imp-07, Imp-08, Imp-09

See index: `IMP11_INVESTIGATION_INDEX.md`.

---

## 1. Goal

Preserve **all** Administration capabilities from both sources by finishing only categories **3 / 4 / 5** owned by Imp-11 — without cloning CVL wholesale and without discarding Unified-native features.

---

## 2. Work by merge category

### Category 1 — Already merged → **no Imp-11 work**

| Cap | Evidence owner |
|---|---|
| Create / delete / list users | Imp-03 |
| Password ≥ 6; role create gate admin\|administratif; delete admin-only | Imp-03 |
| Self-delete block; zone-chef delete block | Imp-03 |
| Roles enum; email unique; JWT; refresh; `password_hash`; `actif` | Imp-02 |
| Cascade user FK data | Schema Imp-02–06 |

### Category 2 — Reuse → **consume only**

| Cap | Owner | Imp-11 rule |
|---|---|---|
| Chantiers CRUD + cascade | Imp-04 | Never rewrite |
| Affectations assign / soft-remove / `chef_equipe_id` write | Imp-05 | Never rewrite; FE/API continue here |
| Zones CRUD + ownership | Imp-05 | Never rewrite |
| Demotion / delete checks need ownership facts | Imp-05 tables | **READ only** |

### Category 3 — Needs REST endpoint only → **Imp-11**

| Cap | Action |
|---|---|
| Update profile fields (CVL PostgREST UPDATE) | Add `PATCH /api/users/:id` |
| Response/DTO include `phone` after Cat 4 | Extend serializers on create/list/get/PATCH |

Does **not** invent edit business — edit already exists in CVL FE.

### Category 4 — Needs additive SQL only → **Imp-11 (one file)**

| Cap | DDL (illustrative — not applied in investigation) |
|---|---|
| `phone` (CVL) | `ALTER TABLE profiles ADD COLUMN phone TEXT NOT NULL DEFAULT ''` |
| Matricule nonempty UNIQUE (CVL) | Partial unique index on nonempty matricule |

**Forbidden:** edit migrations 001–009; DROP; rename; recreate.

Gated by **DR-IMP11-002**.

### Category 5 — Needs Administration business → **Imp-11**

| Cap | Logic (evidence-backed) |
|---|---|
| Promote / demote via role PATCH | Flow C + management |
| Demotion guard | Block if active `affectations.chef_equipe_id` OR owns `zones_equipe` (FE + SHARED #3 adjacency) |
| Admin role lock | FE `isAdminUserRoleLocked` — cannot change role of target `admin` |
| Nom/prenom required on admin create/update | Edge create-user required fields |
| Matricule immutable on edit | FE forces existing matricule |
| Optional structured admin logs | DR-IMP11-003 → prefer logs |

**Does not:** redesign affectations/zones; auto-mass-rewrite `chef_equipe_id` (keep Cat 2 Imp-05 writes).

### Category 6 — Deferred → **not Imp-11**

| Cap | Owner |
|---|---|
| `/functions/create-user`, `/functions/delete-user` | Imp-12 (DR-IMP11-001) |
| `/rpc/delete_chantier_cascade` | Imp-12 |
| `/tables/profiles` | Imp-12 |
| Super Admin / Flow H | Project Decision Log Deferred |

---

## 3. Suggested Imp-11 delivery sequence (after authorize)

1. **Migration 010 (additive only)** — phone + matricule nonempty UNIQUE (DR-002).  
2. **Users service** — PATCH + validations + demotion/role-lock policies (Cat 3+5).  
3. **Wire phone** on create/list/get (extend Imp-03 paths without rewriting delete/list semantics).  
4. **Tests** — PATCH; promote; demote blocked (affectation + zone); admin lock; regression Imp-01→Imp-09.  
5. **Reports** — Imp-11 implementation evidence.  
6. **STOP** for review — do **not** auto-start Imp-12.

---

## 4. API delta (illustrative)

| Method | Path | Roles | Notes |
|---|---|---|---|
| PATCH | `/api/users/:id` | admin (update others; match CVL RLS spirit) | Cat 3+5 |
| Existing | GET/POST/DELETE `/api/users` | unchanged ownership Imp-03 | Cat 1 |

No `/api/admin` prefix required by evidence.

---

## 5. Explicit non-goals

- Duplicate Imp-03 create/delete  
- Rewrite Imp-04/05  
- Touch Imp-06–09  
- FE code under `chantier1/`  
- Edge adapters (unless DR-001 = B)  
- Invent Super Admin  

---

## 6. Definition of Done (future coding phase)

- [ ] DR-001 + DR-002 answered in project Decision Log  
- [ ] Cat 3+4+5 delivered; Cat 1+2 untouched as business  
- [ ] One additive migration only  
- [ ] Regression Imp-01→Imp-09 PASS  
- [ ] UNION preserved (CVL phone/demotion + Unified actif/credentials)  
- [ ] Commit + push + STOP  

---

## 7. Investigation STOP

This plan is **not** authorization to implement. Index validation: `IMP11_INVESTIGATION_INDEX.md` §FINAL VALIDATION = PASS for investigation completeness.
