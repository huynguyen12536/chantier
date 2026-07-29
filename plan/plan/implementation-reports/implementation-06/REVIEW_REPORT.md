# REVIEW_REPORT — Imp-06 Timesheet

**Role:** Independent Review Sub-Agent (read-only)  
**Date:** 2026-07-14  
**Scope:** `git diff c375427b28..cddc4e452e` — Imp-06 Timesheet delivery only  
**Out of scope:** Imp-07 Review & Approval files; no source edits; no commits  

**Authority:** `migration-analysis/` (SUMMARY, business-flows, database-schema, entity-relationship, rls-analysis, auth-flow, SHARED_BUSINESS_RULES, Verified Dump, Merge Spec / DRs) + Decision Log winners DR-IMP06-001/002/003.

---

## Verdict

**FAIL** — Imp-06 correctly implements several Decision Log winners (Soft Annulee, CADRE path existence, omit `nb_deplacements`, auto-approve audit fix, app-owned sync TX), but **does not reach CVL / FE Contract / RLS parity** required for Timesheet Flow D. Prior internal `REVIEW_REPORT` PASS is **overruled**.

---

## PASS

| ID | Finding | Trace |
|---|---|---|
| P1 | Soft Annulee on empty active periods — no hard DELETE of declaration | DR-IMP06-001; SUMMARY §5 #7; Flow D cancel soft path |
| P2 | Declaration UNIQUE `(user_id, chantier_id, date)` | SUMMARY §5 #5; dump schema |
| P3 | Period statuses CHECK exclude `annulee` | database-schema §2.4; SUMMARY §5 #6 |
| P4 | Declaration statuses include `annulee` / `brouillon` | database-schema §2.5 |
| P5 | Sync + optional auto-approve run in **application services** inside `withTransaction` (no SQL business triggers) | TIMESHEET_DOMAIN_ANALYSIS § architecture; triggers_mapping Merge Spec |
| P6 | Sync upsert **does not write** `nb_deplacements` | DR-IMP06-003 / C-08 preserve |
| P7 | Auto-approve sets **`validated_by` + `validated_at`** via system actor | DR-IMP06-003 fix of CVL audit gap |
| P8 | Auto-approve match rule: single non-`rejetee` period + exact chantier/heures/panier/déplacement vs latest validated | SUMMARY §5 #9; `auto_approve_if_matches_latest_validated_shift.md` |
| P9 | Decision `validee`/`rejetee` propagates to periods `terminee`/`en_cours` | SUMMARY §5 #8; Flow E trigger replacement |
| P10 | Cancel declaration path deletes related open/rejected periods (Flow E cancel sketch) | business-flows Flow E |
| P11 | Ouvrier cannot call decide (403 tested) | rls-analysis declarations; Flow E actors |
| P12 | Resubmit `rejetee` → `terminee` for owner allowed in update path | SUMMARY §5 #15 |
| P13 | Fallback 7h when cadre missing/invalid | SUMMARY §5 #10; DR-IMP06-002; `calculer_heures_cadre_chantier.md` |
| P14 | FE not modified in Imp-06 commit | FE Frozen rule |
| P15 | Tests cover soft-annulee, create+sync, decide+propagate, ouvrier decide forbid | Imp-06 test file |

---

## WARNING

| ID | Finding | Trace / why |
|---|---|---|
| W1 | `chef_equipe` `assertCanWritePeriod` allows **any** write without assignment/zone/supervised scope (“refine Imp-07”) | SUMMARY §5 #11; rls-analysis periodes |
| W2 | `listPeriods` / `listDeclarations` for non-ouvrier: filters optional → **global read** if query empty | rls-analysis SELECT scoped by chef helpers |
| W3 | Cadre assembled as single window `debut_matin ‖ apres_midi` → `fin_apres_midi ‖ fin_matin` — lunch gap not modeled; may over-count normales vs multi-slot FE intuition | DR-IMP06-002 says use `heure_*`; FE contract historically `heure_debut`/`heure_fin` single pair (`types` / `ouvrierDeclaration`) |
| W4 | `nb_paniers` counted per period flag (`+=1`) without dump CHECK `<= 2`; dump view used `bool_or` → 0/1 | production `synthese_heures_journalieres`; dump CHECK |
| W5 | No `SELECT FOR UPDATE` / uniqueness lock beyond UNIQUE on declaration — concurrent period writes race possible | TRANSACTION_BOUNDARY expectation; Imp-06 concurrency check |
| W6 | System auto-approve profile seeded with `crypt()` password as `admin` role | auth-flow / security hygiene (not a CVL legacy rule, operational risk) |
| W7 | REST surface `/api/timesheet/*` only — no evidenced table-adapter shapes for frozen FE Supabase client in this package | `fe_contract_matrix.md` tables `periodes_travail`, `declarations_heures` |
| W8 | Imp-06 `decide` overlaps Flow E (Imp-07). Later HEAD delegates to validation module — architecture dual path risk (noted; Imp-07 not fully scored here) | FLOW_CONTRACTS D vs E |
| W9 | Declaration hours `NUMERIC(6,2)` vs dump `NUMERIC(4,2)`; period GPS columns simplified | dump schema |
| W10 | Tests do not cover assignment gate, GPS coherence, CADRE with matin/apres-midi lunch, auto-approve match/miss, concurrent writes | TEST gap vs Flow D |

---

## FAIL

| ID | Finding | Trace |
|---|---|---|
| F1 | **No worksite visibility/assignment gate** on create/update period: ouvrier may write any `chantier_id` without proving affectation ∪ active zone membership | SUMMARY §5 #12; Flow D “load assigned worksites”; AuthContext FE pattern |
| F2 | **FE field naming mismatch — periods:** API/DB use `panier`; Verified Dump + FE use **`panier_repas`** | production-dump `periodes_travail`; FE `types` / `ouvrierDeclaration` / `useTimeCalculations` |
| F3 | **FE GPS shape mismatch:** API uses `latitude`/`longitude`; dump + FE contract use **`latitude_debut`/`longitude_debut`/`latitude_fin`/`longitude_fin`** (+ coherence CHECKs) | dump `periodes_travail` constraints; frontend-supabase usage |
| F4 | Missing CVL period CHECK: `(heure_fin IS NULL ∧ statut=en_cours) ∨ (heure_fin IS NOT NULL ∧ statut≠en_cours)` | dump CONSTRAINT; SUMMARY §5 #6 |
| F5 | Missing dump period GPS end/start coherence constraints | dump `periodes_travail_check1` |
| F6 | Missing dump declaration CHECKs (`heures_*` 0–24, `nb_paniers` 0–2) | dump `declarations_heures_*_check` |
| F7 | **RLS parity incomplete for chef list/decide:** decide route allows any `chef_equipe` without `get_chef_chantier_ids` / zone / supervised scope | SUMMARY §5 #11; rls-analysis §62–95 |
| F8 | Chantier cadre fields for FE are historically `heure_debut`/`heure_fin` on `chantiers`; Imp-04/06 store matin/apres_midi only — no adapter mapping documented in Imp-06 DTO for frozen FE | FE `chantiers(heure_debut, heure_fin)`; DR-IMP06-002 |

---

## Business parity

**Partial.**  
Aligned: declaration uniqueness; soft annulee winner; sync-from-periods orchestration; auto-approve pattern; validate propagates; 7h fallback; omit `nb_deplacements`.  
Not aligned: assignment∪zone prerequisite for declare (rule #12); chef scoped authorize (rule #11); period open-state coherence (rule #6 dump CHECK).

## Architecture parity

**Partial / directed OK for Wave2 app services.**  
Business logic correctly moved out of SQL triggers into services + single TX write path — matches Imp-06 analysis mission.  
Gaps: permission helpers not centralized to CVL chef scope; decide straddles Imp-06/07; FE adapter layer for table contract not delivered in this module package.

## CVL parity

**Partial.**  
Core Flow D/E mechanics present for happy path.  
Deviations that invent/alter contract shape: `panier` vs `panier_repas`; GPS column collapse; relaxed CHECKs; permissive chef write; no affectation gate.

## RLS parity

**FAIL (scoped read/write).**  
Ouvrier own-row write mostly OK for identity, but **not** for chantier membership.  
Chef/admin list and chef decide **lack** CVL multi-layer scope.  
Administratif decide allowed (broader than some zone policies; acceptable for declarations validation path per Flow E / administ. export→review adjacency) — retained as non-blocking WARNING vs F7.

## Flow parity

| Flow | Result |
|---|---|
| D declare → sync → optional auto-approve | **Partial** (works without assignment gate; schema/FE name drift) |
| D edit/delete → resync / soft annulee | **PASS** for Soft Annulee winner |
| E decide + period propagation | **Partial** (logic yes; chef scope no) |
| E cancel annulee + delete periods | **PASS** sketch present in Imp-06 decide |
| G week replicate | **Not covered** (FE multi-insert; no Imp-06 regression) |

## Schema parity

**FAIL vs Verified Dump field/CHECK set; PASS on UNIQUE declaration + period statut enum intention.**  
Migration `005_timesheet.sql` is DDL-only (good). Material FE-breaking renames/`latitude` simplification are blockers for FE Contract parity even if Wave2 REST-only consumers exist.

## FE Contract parity

**FAIL** if frozen FE is expected to consume the same row shapes (tables / Future adapters).  
Evidence: `panier_repas`, GPS debut/fin columns, chantier `heure_debut`/`heure_fin`.  
REST-only Wave2 consumer note in `API_COVERAGE.md` does **not** cancel `fe_contract_matrix` obligation for table adapters unless Decision Log explicitly deferred adapters — **none cited in Imp-06 commit messages as deferral of F2/F3/F8**.

---

## Risk

| Level | Item |
|---|---|
| **Critical** | Ouvrier can declare on unassigned chantiers (F1) — integrity + authorization breach vs SUMMARY #12 |
| **High** | FE adapter/table contract field mismatch (F2/F3/F8) — frozen FE cannot bind without FE change or backend rename/adapter |
| **High** | Chef unscoped decide/list (F7/W1/W2) — authorization wider than CVL |
| **Medium** | Cadre lunch flattening (W3); panier aggregation (W4); concurrency (W5) |
| **Low** | Numeric precision (W9); system actor seed (W6) |

---

## Recommendation

Developer Agent (post Imp-06) should address **before treating Imp-06 as CVL-closed**:

1. Enforce **affectation ∪ active zone** (and matching FE AuthContext semantics) before period write — SUMMARY #12.  
2. Align period DTO/schema naming to FE/dump: **`panier_repas`**, GPS **`latitude_debut` / `longitude_debut` / `latitude_fin` / `longitude_fin`** (or explicit adapter layer that maps FE shape ↔ storage without changing FE).  
3. Restore dump CHECKs for period open-state and GPS coherence; restore declaration hour/panier bounds.  
4. Apply chef scope equivalent to `get_chef_chantier_ids` / zone / supervised for list + decide + team period writes (may share Imp-07 authz — still required for Timesheet read paths).  
5. Document cadre mapping: matin/apres_midi → FE `heure_debut`/`heure_fin` (single pair) or implement split matching `calculer_heures_cadre_chantier` + FE `computeChantierHoursBreakdown`.  
6. Extend tests for F1, auto-approve miss/hit, Soft Annulee only on `soumise`, scoped chef forbid.

**Do not** mark Imp-06 “legacy parity PASS” until F1–F3 and F7 are resolved or explicitly Decision-Logged as deferred with FE adapter ownership.

---

## Checklist (requested dimensions)

| # | Dimension | Result |
|---|---|---|
| 1 | Business Logic Flow D | WARNING / Partial |
| 2 | Permission CVL | FAIL |
| 3 | Transaction | PASS (withTransaction present) |
| 4 | Validation | WARNING (zod present; missing CVL CHECKs) |
| 5 | Concurrency | WARNING |
| 6 | API Contract | WARNING (REST ok; table/FE shape fail) |
| 7 | DTO | FAIL vs FE field names |
| 8 | Repository | PASS structurally; FAIL missing scope queries |
| 9 | Migration | WARNING / FAIL vs dump CHECKs & columns |
| 10 | Naming | FAIL (`panier` vs `panier_repas`) |
| 11 | Error Handling | PASS (AppError codes used) |
| 12 | Architecture | PASS direction; WARNING Imp-06/07 decide split |
| 13 | FE Contract (backend follows FE) | FAIL |
| 14 | Legacy parity | FAIL overall; PASS on DR winners only |

---

*End of independent review. No source changes made.*
