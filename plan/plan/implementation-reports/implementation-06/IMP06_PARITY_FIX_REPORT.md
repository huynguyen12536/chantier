# IMP06_PARITY_FIX_REPORT

**Scope:** Verified CVL parity gaps P1–P6 only  
**DRs:** DR-001 Soft Annulee, DR-002 CADRE, DR-003 P+Fsplit — **CLOSED, unchanged**  
**SoT:** `migration-analysis/SUMMARY.md`, business-flows, rls-analysis, database-schema, production-dump, Merge Spec, Unified Domain  
**Test run:** `npm test` in `api-chantier` — **38/38 PASS**

---

## Gates

| Gate | Result |
|---|---|
| Unit / Integration / Regression tests | **PASS** (38) |
| Architecture Review | **PASS** — app-layer AuthZ only; no SQL biz rules; no FE; no column rename; additive migration only |
| Business Validation | **PASS** — SUMMARY #11/#12 + Soft Annulee lifecycle preserved |
| CVL Validation | **PASS** for P1–P6 targets; remaining drifts listed below (accepted) |

**Commit/push:** allowed only because all gates PASS.

---

## Modified / added files

### Application

| File | Change |
|---|---|
| `api-chantier/src/shared/authz/chantierAccess.js` | **NEW** — SUMMARY #12 active affectation ∪ zone membership |
| `api-chantier/src/shared/authz/chefScope.js` | Chef scope = affectation ∪ zone (`chef_equipe_id`) ∪ supervised affectations |
| `api-chantier/src/modules/timesheet/services/timesheetService.js` | P1 write gate; P2 chef scope on CUD/approve paths; P5 scoped lists |
| `api-chantier/src/modules/timesheet/dto.js` | P3 request/response mappers (`panier_repas`, `latitude_debut`, …) |
| `api-chantier/src/modules/timesheet/validation.js` | Accept FE aliases without renaming storage |

### Schema (additive only)

| File | Change |
|---|---|
| `api-chantier/migrations/008_imp06_parity_checks.sql` | **NEW** — open/statut period CHECK; heures 0–24; `nb_paniers` 0–2 |

### Tests

| File | Change |
|---|---|
| `api-chantier/test/timesheet.parity.test.js` | **NEW** — P1–P6 regression suite |
| `api-chantier/test/timesheet.test.js` | Assert FE field `panier_repas` on create response |

### Report

| File | Change |
|---|---|
| `plan/.../IMP06_PARITY_FIX_REPORT.md` | This document |

**Explicitly not modified:** Frontend, Decision Logs, DR-001/002/003 behavior, lunch/bool_or redesign, migration `005` rewrite, storage column names.

---

## Business rules fixed

| ID | Rule | Fix |
|---|---|---|
| P1 / SUMMARY #12 | Ouvrier create/update/delete period requires **ACTIVE affectation OR ACTIVE zone** for chantier | `assertActiveChantierAccess` in Application Service before write |
| P2 / SUMMARY #11 | Chef never global — assignment ∪ zone ∪ supervised | `getChefChantierIds` + `assertCanReviewChantier` on write/decide/list |
| P3 | FE contract without DB rename | DTO `fromPeriodRequest` / `fromPeriodPatch` / `mapPeriod` |
| P4 | Missing dump CHECKs (verified subset) | Migration `008` additive only |
| P5 | Scoped lists by role | Worker self; chef supervised chantiers; admin/administratif full |
| P6 | Regression coverage | See test evidence |

---

## CVL evidence

| Claim | Evidence |
|---|---|
| SUMMARY #12 | `migration-analysis/SUMMARY.md` rule 12 — ouvrier site via affectation ∪ zone |
| SUMMARY #11 | Same file rule 11 — chef via assignment / zone / supervised / `get_chef_chantier_ids` |
| App-layer only | Gate lives in `timesheetService` + `chantierAccess.js`; no business predicate moved into SQL functions |
| Soft Annulee | Unchanged DR-001 — delete last period → declaration `annulee`, row kept |
| FE aliases | Dump/FE use `panier_repas`, `latitude_debut`; storage remains `panier`, `latitude` (Merge/DTO path) |
| Dump CHECKs | Open/statut + heures bounds + `nb_paniers` 0–2 restored additively; `periodes_heure_coherence` already in `005` |

---

## Test evidence

Command: `cd api-chantier && npm test`

```
ℹ tests 38
ℹ pass 38
ℹ fail 0
```

Parity suite (`timesheet.parity.test.js`):

| Case | Result |
|---|---|
| P1 worker without assignment | 403 `FORBIDDEN_CHANTIER` |
| P1 worker via zone membership | 201 allowed |
| P2/P5 chef outside scope | 403 on approve; empty list |
| P2/P5 chef inside scope | lists supervised only |
| P4 declaration hour CHECK | out-of-range rejected |
| P6 auto-approve hit | matching latest validated shift |
| P6 auto-approve miss | different shift stays soumise |
| P6 Soft Annulee | row kept, statut `annulee` |

Also green: Imp-01…05, Imp-06 base, Imp-07 validation, Imp-08 export.

---

## Migration evidence

`008_imp06_parity_checks.sql`:

- `periodes_travail_open_statut_check` — `(fin NULL ∧ en_cours) ∨ (fin NOT NULL ∧ ≠ en_cours)`
- `declarations_heures_heures_normales_check` — `[0, 24]`
- `declarations_heures_heures_supplementaires_check` — `[0, 24]`
- `declarations_heures_nb_paniers_check` — `[0, 2]`
- Idempotent via `duplicate_object` handlers
- **No DROP / rename / rewrite of `005`**
- End ≥ start already enforced by `005` `periodes_heure_coherence`

---

## Remaining accepted drifts

| Drift | Reason |
|---|---|
| Storage columns `panier` / `latitude` / `longitude` | No rename per governance; FE names via DTO only |
| No `latitude_fin` / `longitude_fin` / `commentaire` storage columns | Absent from Unified `005`; GPS fin CHECK not added (would require columns) |
| Cadre from Imp-04 matin/après-midi columns | DR-002 closed; not FE `heure_debut`/`heure_fin` on chantiers |
| Lunch slot / `bool_or` aggregation | Explicitly out of scope |
| Imp-07/08 modules present on branch | Not part of this parity fix; no redesign |

---

## SHA

Recorded after successful commit + push (fill below at ship time):

- **Commit SHA:** _(see git log after push)_
- **Remote:** `origin/main`
