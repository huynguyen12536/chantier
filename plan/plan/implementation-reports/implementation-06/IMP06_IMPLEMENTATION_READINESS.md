# IMP06_IMPLEMENTATION_READINESS — Go / No-Go

**Role:** Senior Backend Architecture Review Agent  
**Question:** Is Imp-06 (Timesheet Domain Analysis + claimed delivery) sufficient to allow / close implementation with CVL + FE Contract integrity?  
**Git baseline:** Analysis `0754a7d338` · Delivery `cddc4e452e` · (User-cited `29dab9bf` = Imp-08 — out of scope)

---

## Verdict

# NOT READY

Not READY. Not READY WITH CONDITIONS.

Imp-06 cannot be treated as an implementation-ready / implementation-closed Timesheet gate against Source of Truth.

---

## Why NOT READY (blockers)

Each blocker lists: what is missing, where, evidence, migration-analysis mapping.

### B1 — Affectation ∪ zone gate missing (SUMMARY #12)

| | |
|---|---|
| **Missing** | Service precondition: ouvrier may write period only if active affectation **or** active zone membership for `chantier_id` |
| **File** | `api-chantier/src/modules/timesheet/services/timesheetService.js` (`assertCanWritePeriod`); analysis §8/§9 TR-08 under-specified as implementable algorithm |
| **Evidence** | Function returns for ouvrier on `actor.id === userId` only — no chantier check |
| **SoT** | `SUMMARY.md` §5 #12; `business-flows.md` Flow D; FE worksite load pattern (`frontend-overview` / AuthContext usage) |

### B2 — FE / dump period field shape mismatch

| | |
|---|---|
| **Missing** | Bound field dictionary + storage/DTO using `panier_repas`, `latitude_debut`, `longitude_debut`, `latitude_fin`, `longitude_fin` (+ `commentaire`) **or** Decision-owned adapter |
| **File** | `dto.js`, `validation.js`, `repository.js`, `migrations/005_timesheet.sql`; Analysis §14 vague “match FE” without columns |
| **Evidence** | FE `types/index.ts`, `declare-day.tsx`; dump `01_public_schema.sql` periodes_travail |
| **SoT** | `fe_contract_matrix.md`; `production-dump/01_public_schema.sql`; `frontend-supabase-usage.md` |

### B3 — Dump CHECKs not in migration

| | |
|---|---|
| **Missing** | Period open-state CHECK; GPS coherence CHECK; declaration hours 0–24; nb_paniers 0–2 |
| **File** | `005_timesheet.sql`; Analysis § mentions CHECKs but does not list them for migration |
| **Evidence** | dump CONSTRAINT names `periodes_travail_check`, `periodes_travail_check1`, `declarations_heures_*_check` |
| **SoT** | `production-dump/01_public_schema.sql`; `database-schema.md` §2.4–2.5; SUMMARY #6 |

### B4 — Chef / list AuthZ scope missing (SUMMARY #11)

| | |
|---|---|
| **Missing** | Equivalent of `get_chef_chantier_ids` / zone / supervised on list + decide + team period writes; documented Decision if deferring |
| **File** | `timesheetService.js` list/ write; Imp-06 `PERMISSION_MATRIX.md` explicitly “refine Imp-07” without Decision Log |
| **Evidence** | chef branch unconditional; empty filter = all rows |
| **SoT** | `SUMMARY.md` #11; `rls-analysis.md` §periodes_travail / declarations; `functions/get_chef_chantier_ids.md` |

### B5 — False readiness claims / process integrity

| | |
|---|---|
| **Missing** | Consistent gate: Analysis UNBLOCKED vs BLOCKED; TRACEABILITY #12 vs code; independent FAIL vs PIPELINE PASS |
| **File** | `TIMESHEET_DOMAIN_ANALYSIS.md` §20–§21; `TRACEABILITY_MATRIX.md`; `PIPELINE_SUMMARY.md`; prior `REVIEW_REPORT.md` FAIL |
| **Evidence** | Contradictory text + untrue Binding row |
| **SoT** | Process cannot override CVL; Merge Spec “no invent” |

### B6 — Chantier CADRE column contract unresolved for FE

| | |
|---|---|
| **Missing** | Mapping FE `heure_debut`/`heure_fin` ↔ Imp-04 matin/apres_midi (+ lunch semantics) as adapter or schema Decision |
| **File** | `domain/calculation.js` `cadreFromChantier`; Imp-04 chantiers service; Analysis TR-07 / DR-002 without FE column map |
| **Evidence** | FE selects `heure_debut, heure_fin`; calculation reads `heure_debut_matin`… |
| **SoT** | `database-schema.md` §2.2; FE declare-day; `calculer_heures_cadre_chantier.md`; DR-IMP06-002 |

---

## Conditions that would be required for “READY WITH CONDITIONS”

Listed for clarity — **not granted**, because P0 blockers above are open and currently violated in delivery:

1. Binding AuthZ #12 on all period writes (+ tests denying unassigned chantier).  
2. FE-compatible period shape **or** Decision-Logged adapter with Imp-12 ownership and no silent rename.  
3. Dump CHECKs restored (or Decision to drop with product owner + FE impact).  
4. Chef scope #11 on list/decide **or** Decision deferral with residual risk accepted (RK-02).  
5. Cadre FE column mapping Decision/adapter.  
6. Correct TRACEABILITY / Analysis gate flags; re-run independent review.  
7. Tests for auto-approve hit/miss, soft-annulee only soumise behavior, overlap or documented FE-only ownership.

Until then: **NOT READY**.

---

## What WAS sufficient in analysis (do not discard)

- Trigger → service mapping.  
- Aggregate / TX table for declare/validate.  
- Opening DRs for C-03/C-04/C-08/C-09 instead of silent invent.  
- Flow G week RPC deferral (matches CVL absence + commented FE).  
- FE Frozen principle stated.

These are necessary but **not sufficient**.

---

## Relationship to already-shipped Imp-06 code

Code at `cddc4e452e` proves partial ability to implement DR winners. It also proves analysis gaps were real (F1–F3 style faults materialized). Architecture Review does **not** authorize treating that ship as Imp-06 PASS for CVL/FE gate.

No remediation performed in this review. No DR answers chosen.

---

## Output index

| Report | Path |
|---|---|
| Review | `IMP06_REVIEW_REPORT.md` |
| Gaps | `IMP06_GAP_ANALYSIS.md` |
| CVL | `IMP06_CVL_PARITY_REPORT.md` |
| FE | `IMP06_FE_CONTRACT_REPORT.md` |
| Architecture | `IMP06_ARCHITECTURE_REVIEW.md` |
| Drift | `IMP06_DRIFT_REPORT.md` |
| Risk | `IMP06_RISK_REPORT.md` |
| Readiness | this file |

**FINAL: NOT READY**
