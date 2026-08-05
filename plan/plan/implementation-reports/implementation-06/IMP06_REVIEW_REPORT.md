# IMP06_REVIEW_REPORT — Architecture Review (Imp-06 Timesheet)

**Role:** Senior Backend Architecture Review Agent (read-only)  
**Date:** 2026-07-14  
**Git scope:** `0754a7d338` (analysis) → `cddc4e452e` (Imp-06 delivery)  
**Note on cited SHA:** User SHA `29dab9bf…` is **Imp-08 (Export)**; Imp-06 delivery SHA is **`cddc4e452e`**. Review covers Imp-06 only.  
**Authority:** `migration-analysis/` (SUMMARY, business-flows, database-schema, entity-relationship, rls-analysis, auth-flow, frontend-supabase-usage, tables-used-by-frontend, functions/*, triggers/*, production-dump/*, Merge Spec, Unified Domain, CVL).  
**Actions taken:** Review + report only. No code/plan/SoT edits. No DR selection.

---

## Verdict (executive)

**NOT READY** for treating Imp-06 as implementable-complete / CVL-closed.

Domain analysis (`TIMESHEET_DOMAIN_ANALYSIS.md` at `0754a7d338`) correctly mapped triggers→services and opened DRs for C-03/C-04/C-08/C-09. It did **not** bind FE column shapes, dump CHECKs, or SUMMARY #11/#12 enforcement tightly enough. Delivery `cddc4e452e` implemented DR winners but **failed FE Contract + RLS outcome parity**. Internal pipeline PASS contradicts independent CVL evidence.

---

## Evidence corpus reviewed

| Artifact | Role |
|---|---|
| `TIMESHEET_DOMAIN_ANALYSIS.md` | Domain gate (analysis) |
| DR-IMP06-001/002/003 | Resolved winners (Soft Annulee / CADRE / P+Fsplit) |
| Imp-06 matrices (LEGACY/PERMISSION/API/TX/TEST/VALIDATION/ARCHITECTURE) | Claimed delivery |
| `api-chantier` timesheet module + `005_timesheet.sql` + `test/timesheet.test.js` | Git Diff delivery |
| `migration-analysis/*` listed in SoT | Ground truth |
| Prior `REVIEW_REPORT.md` (FAIL) | Cross-check — revalidated independently |

---

## 1. Domain Model / Lifecycle / State

| Item | Finding | Evidence |
|---|---|---|
| Actors | Documented (ouvrier/chef/administratif/admin) | Analysis §2; business-flows D/E/F |
| Aggregate DailyTimesheet | Proposed `(user, chantier, date)` | Analysis §6; SUMMARY #5 |
| Period statut | CHECK without `annulee` — OK | dump `periodes_travail_statut_check`; schema §2.4 |
| Declaration statut | Includes `annulee`/`brouillon` — OK | dump CHECK; schema §2.5 |
| Open→terminee coherence | **Missing** dump CHECK `(heure_fin NULL ↔ en_cours)` in migration | dump `periodes_travail_check` vs `005_timesheet.sql` |
| Dead / invalid / missing states | Soft Annulee only from `soumise`; transitions from `validee`/`rejetee` empties not fully specified | `softAnnuleeDeclaration` `AND statut = 'soumise'`; Analysis §4.2 |
| Rollback design | Analysis §18 OK at design level | Analysis §18 |

**Internal doc contradiction:** Analysis header + §21 still say Implementation **BLOCKED**; §20 says **UNBLOCKED**. Pipeline claims PASS. Gate hygiene failed.

---

## 2. Business Flows D / E / G

| Flow | Analysis | Delivery | Result |
|---|---|---|---|
| **D** declare → sync → optional auto-approve | Mapped | TX create works; **no affectation∪zone gate** | **Partial** |
| **D** edit/delete → soft annulee | Mapped | Soft Annulee PASSes DR-001 | **PASS** (winner) |
| **E** chef decide + period propagate | Mapped (often Imp-07) | Propagate works; **chef unscoped** | **Partial** |
| **E** cancel annulee + delete periods | Documented | decide path present | Partial / thin test |
| **G** week replicate | Deferred RPC correctly | No batch parity / no overlap tests | **Not covered** |

Preconditions Flow D (“load assigned worksites”) from `business-flows.md` **not enforced** in `createPeriod`.

---

## 3–15. Dimension scores (summary)

| # | Dimension | Score | One-line |
|---|---|---|---|
| 1 | Domain / state | WARNING | Machines sketched; dump CHECK missing |
| 2 | Business flow | WARNING | D/E partial; G uncovered |
| 3 | Legacy mapping | PASS (structure) | Triggers→services named; behavior drift elsewhere |
| 4 | FE Contract | **FAIL** | `panier`≠`panier_repas`; GPS shape collapsed |
| 5 | API Contract | WARNING | REST present; pagination/idempotency/batch/realtime absent |
| 6 | Repository / TX | PASS / WARNING | `withTransaction` OK; no lock strategy |
| 7 | Migration | **FAIL** vs dump | Columns + CHECKs diverge |
| 8 | Permission | **FAIL** | #11/#12 outcomes missing |
| 9 | Validation | WARNING | Zod weak vs dump bounds |
| 10 | Concurrency | WARNING | UNIQUE only; no conditional approve lock in Imp-06 TX notes fully exercised |
| 11 | Architecture | PASS direction | App services replace triggers; Imp-06/07 decide dual-path risk |
| 12 | Drift beyond 3 DRs | **Open** | Field rename, GPS, CHECK, cadre FE mapping, panier aggregate |
| 13 | Risk | **Critical+High** | AuthZ breach + FE bind break |
| 14 | Testability | WARNING | 4 API cases; no F1/auto-approve hit-miss/concurrency |
| 15 | Completeness for implement | **FAIL** | Analysis under-specified FE/dump binding |

---

## PASS (binding alignment)

1. Soft Annulee — no hard DELETE (DR-001).  
2. UNIQUE `(user_id, chantier_id, date)`.  
3. App-owned sync / auto-approve / propagation (no SQL business triggers).  
4. Omit `nb_deplacements` on sync (DR-003 P+).  
5. Auto-approve sets `validated_by` + `validated_at` (DR-003 F).  
6. CADRE path + 7h fallback exists (DR-002).  
7. FE source tree not modified in Imp-06 commit.  
8. Ouvrier 403 on decide (tested).

---

## FAIL (blockers)

1. **SUMMARY #12** — no affectation ∪ zone gate on period write (`timesheetService.js` `assertCanWritePeriod`).  
2. **FE/dump `panier_repas`** vs API/DB `panier`.  
3. **FE/dump GPS** `latitude_debut|fin` / `longitude_debut|fin` vs `latitude`/`longitude`.  
4. Missing dump period CHECK open-state + GPS coherence.  
5. Missing dump declaration CHECKs hours 0–24, `nb_paniers` 0–2.  
6. **SUMMARY #11** chef scope (`get_chef_chantier_ids` / zone / supervised) absent on list/write/decide.  
7. TRACEABILITY claims #12 “Binding” with service scoping — **false vs code**.  
8. Analysis completeness insufficient as implementation gate (field dictionary, adapter ownership, authZ algorithm not bound).

---

## WARNING (non-exhaustively)

- Cadre: flatten matin‖apres_midi → single window vs FE `heure_debut`/`heure_fin` + lunch gap.  
- `nb_paniers` count +=1 vs dump view `bool_or` → 0/1.  
- Soft Annulee restricted to `soumise` only.  
- Realtime (`fe_contract_matrix` / FE inventory) not delivered.  
- Flow G / overlap FE pre-check not ported.  
- Administ. / chef list = global when filters empty.  
- System actor seeded as `admin` with `crypt()` password.  
- NUMERIC(6,2) vs dump NUMERIC precision differences.  
- Analysis status contradiction BLOCKED vs UNBLOCKED.

---

## Recommendation

Do **not** Auto-Continue Imp-06 as “legacy parity PASS”. Treat Imp-06 as **analysis+partial delivery**. Re-open implementation readiness only after blockers in `IMP06_IMPLEMENTATION_READINESS.md` are closed or Decision-Logged with explicit FE-adapter ownership — without inventing answers here.
