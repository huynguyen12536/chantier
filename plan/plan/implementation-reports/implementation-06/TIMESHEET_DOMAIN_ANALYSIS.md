# TIMESHEET_DOMAIN_ANALYSIS — Imp-06

**Module:** Wave 2 Implementation-06 Timesheet Domain  
**Status:** ✅ Analysis PASS · ⛔ Implementation **BLOCKED** on Decision Requests  
**Date:** 2026-07-14  
**Method:** Reverse from Current Verified Legacy only — no invention  
**Code:** **None** in this deliverable  

---

## 0. Source of Truth read (mandatory)

| Source | Used for |
|---|---|
| `migration-analysis/SUMMARY.md` | Rules 5–15; trigger risk |
| `migration-analysis/business-flows.md` | Flows D, E, F, G |
| `migration-analysis/database-schema.md` | Period/declaration CHECKs; view; dump vs repo |
| `migration-analysis/entity-relationship.md` | Aggregate graph; trigger path |
| `migration-analysis/frontend-supabase-usage.md` | Screen/API contract |
| `migration-analysis/tables-used-by-frontend.md` | Table contract |
| `migration-analysis/functions/*` | Sync, auto-approve, hours math |
| `migration-analysis/triggers/*` | 3 app triggers |
| `migration-analysis/rls-analysis.md` | Permission outcomes |
| `migration-analysis/auth-flow.md` | Identity context |
| `migration-analysis/merge/triggers_mapping.md` | Unified mapping |
| `migration-analysis/merge/CONFLICT_MATRIX.md` | C-03, C-04, C-08, C-09 |
| `migration-analysis/merge/conflict_register.md` | Open blockers |
| `migration-analysis/merge/ASSUMPTION_REGISTER.md` | A-08 drift winners need approval |
| `migration-analysis/merge/fe_contract_matrix.md` | Frozen FE |
| `migration-analysis/unified/04_STATE_MACHINES.md` | Target state wording |
| Decision Log | O3; Wave 2; FE Frozen |
| Risk Register | R-01 triggers; R-34 FE contract |

**Authority chain for Imp-06:** Merge Spec → Unified Domain → CVL `migration-analysis/` → Decision Log → Risk Register.  
Frontend = **API Contract only**. Database = **persistence only**.

---

## 1. Business Goal

Cho phép **ouvrier** ghi nhận từng **période** (ca) trên **chantier** theo ngày; hệ thống **tổng hợp** thành **déclaration** ngày; **chef/admin** duyệt; **administratif/chef/admin** xuất dữ liệu đã validate.

Trace: `SUMMARY.md` §1, §3; `business-flows.md` Flow D–F.

---

## 2. Actors

| Actor (role) | Timesheet role | Evidence |
|---|---|---|
| `ouvrier` | Create/edit/delete own periods (scoped); resubmit rejected → terminee | RLS periods; Flow D; SUMMARY #12, #15 |
| `chef_equipe` | Read/validate/reject in scope (assignment/zone/supervised); may update periods directly (chef-dashboard) | Flow E; RLS; FE chef-dashboard |
| `administratif` | Broad read; export; not zone-admin by default | Flow F; RLS chantiers/periods |
| `admin` | Full override update/delete per policies | RLS |

---

## 3. Lifecycle (Flow D → E → F/G)

```
Affectation ∪ Zone grants worksite visibility (Imp-05 / SUMMARY #12)
        │
        ▼
Ouvrier SELECT calendar (periods + declarations)
        │
        ▼
INSERT/UPDATE/DELETE periodes_travail   ← Write #1 (FE today)
        │
        ▼ [trigger_sync_declarations]
UPSERT/DELETE|annulee declarations_heures
        │
        ▼ [trigger_auto_approve optional]
soumise → validee (match prior validated shift) OR wait chef
        │
        ▼
Chef UPDATE declarations (validee|rejetee|annulee) and/or periods
        │
        ▼ [trigger_sync_periods_from_declaration]
Propagate statut to periods terminee|en_cours
        │
        ▼
Export SELECT validated periods (Flow F)
```

Week replicate (Flow G): FE inserts many periods; week RPC **commented / not on hzppst**; may still hit matching-shift auto-approve.

---

## 4. State Machine

### 4.1 `periodes_travail.statut` (CVL CHECK)

Allowed: `en_cours` | `terminee` | `validee` | `rejetee`  
**Not** `annulee` on periods (`database-schema.md` §2.4).

| From | To | Who / when | Evidence |
|---|---|---|---|
| (new) | `en_cours` | startPeriod; `heure_fin` null ↔ en_cours | SUMMARY #6; services/periods |
| `en_cours` | `terminee` | endPeriod / declare finished | Flow D |
| `terminee`/`en_cours` | `validee`/`rejetee` | Chef/admin OR propagation from declaration | Flow E; sync_periods |
| `rejetee` | `terminee` | Own resubmit under RLS | SUMMARY #15 |

### 4.2 `declarations_heures.statut`

Allowed includes **`annulee`** (`database-schema.md` §2.5). Typical: `soumise` | `validee` | `rejetee` | `annulee` (+ legacy `brouillon` noted in RLS for user draft update).

| From | To | Mechanism | Evidence |
|---|---|---|---|
| derived | `soumise` | sync upsert from periods | sync_declarations |
| `soumise` | `validee` | chef UI OR auto-approve matching shift | Flow E; auto_approve fn |
| `soumise` | `rejetee` | chef | Flow E |
| `soumise` | `annulee` | cancel path / soft-cancel (**repo**) | Flow E; repo sync body |
| any daily row | **hard DELETE** | sync when 0 active periods (**hzppst dump**) | sync_declarations Phase 2 |

**Conflict C-04:** soft-cancel vs hard-delete — **open** (`CONFLICT_MATRIX` / `conflict_register`).

---

## 5. Entity Relationship (Timesheet slice)

```
profiles 1──* periodes_travail *──1 chantiers
profiles 1──* declarations_heures *──1 chantiers
UNIQUE declarations (user_id, chantier_id, date)     ← SUMMARY #5
N periods per (user, chantier, date) allowed           ← SUMMARY #6
View synthese_heures_journalieres aggregates periods → sync input
```

Trace: `entity-relationship.md` §2.4.

---

## 6. Aggregate proposal (Unified Platform design)

| Aggregate | Root | Invariants |
|---|---|---|
| **DailyTimesheet** | `(user_id, chantier_id, date)` | Exactly 0..1 declaration; N periods; declaration hours = synthesis of non-rejected periods |
| **WorkPeriod** | `periodes_travail.id` | Consistent heures; statut CHECK; belongs to one DailyTimesheet key |
| **Declaration** | `declarations_heures` unique key | Unique constraint; status machine above |

Write ownership (Merge Spec): **Time Recording** owns period changes + declaration projection; **Review & Approval** owns validate/reject/cancel decisions (+ auto-approve policy).  
Avoid dual FE+trigger double-write in Unified Platform (`triggers_mapping.md`; SUMMARY note on FE redundancy).

---

## 7. Transaction Boundaries (required for Imp-06 impl)

| Use case | Must be single TX | Steps |
|---|---|---|
| Declare / update / delete period(s) | **YES** | persist period(s) → recompute/upsert or cancel/delete declaration → optional auto-approve → optional period propagate |
| Validate / reject declaration | **YES** | update declaration (+ validated_by/at) → propagate periods |
| Cancel declaration | **YES** | set annulee **or** delete per C-04 decision → delete/adjust periods (FE today deletes periods after annulee) |
| Week replicate batch | **YES** (per day or whole week — design) | insert periods → sync declarations → optional auto-approve |
| delete_chantier cascade | Already Imp-04 | periods then declarations… |

**No transaction → Reject** (Imp-06 gate).

---

## 8. Permission Boundary (RBAC replace RLS — outcomes must match)

### Periods (`rls-analysis.md` §periodes_travail)

| Action | ouvrier | chef_equipe | administratif | admin |
|---|---|---|---|---|
| SELECT | own | scope team/zone/supervised | yes | yes |
| INSERT | own only | no (not create for others) | — | yes (admin policies) |
| UPDATE | own if en_cours/terminee; rejetee→terminee | validate path | yes | yes |
| DELETE | own non-validated/rejected per policy | team | — | yes |

### Declarations

| Action | Notes |
|---|---|
| User update | draft/`brouillon` only (RLS) |
| Chef update | when `soumise`/`validee` |
| Admin | full |
| Sync path | Legacy SECURITY DEFINER bypasses RLS — Backend service must enforce authZ then write |

Chef scope: assignment / zone / supervised / `get_chef_chantier_ids` — SUMMARY #11.

---

## 9. Validation Rules (traceable)

| ID | Rule | Trace |
|---|---|---|
| TR-01 | Unique declaration (user, chantier, date) | SUMMARY #5 |
| TR-02 | Multiple periods/day allowed; fin null ↔ en_cours | SUMMARY #6 |
| TR-03 | Rejected periods excluded from active count / sync | sync_declarations |
| TR-04 | Declaration derived from periods; empty active → cancel/delete | SUMMARY #7; sync |
| TR-05 | Validate/reject declaration propagates to periods terminee\|en_cours | SUMMARY #8 |
| TR-06 | Auto-approve if exactly 1 active period matches latest validated shift (chantier+hours+panier+déplacement) | SUMMARY #9; auto_approve fn |
| TR-07 | Hours: cadre split OR fallback 7h — **variant open C-03** | SUMMARY #10; calculer_* / dump view |
| TR-08 | Ouvrier worksite access = affectation ∪ zone | SUMMARY #12 |
| TR-09 | Export UI uses validated periods | SUMMARY #14; Flow F |
| TR-10 | Resubmit rejetee → terminee | SUMMARY #15 |
| TR-11 | `nb_deplacements` may exist but sync upsert omits write — **C-08** | SUMMARY §4 #4 |
| TR-12 | Auto-approve does not set `validated_by` — **C-09** | auto_approve md |

---

## 10. Trigger Mapping → Backend Services

| Legacy Trigger | Event | Backend replacement | Service name (design) |
|---|---|---|---|
| `trigger_sync_declarations` | AFTER I/U/D `periodes_travail` | Domain event after period write | **DeclarationSyncService** |
| `trigger_sync_periods_from_declaration` | AFTER UPDATE statut/validated_* on declarations | After review decision | **PeriodPropagationService** (Review path) |
| `trigger_auto_approve_matching_latest_validated_shift` | AFTER I/U statut declarations | Policy after declaration soumise | **AutoApprovalPolicyService** |

---

## 11. Function Mapping

| Legacy Function | Backend |
|---|---|
| `sync_declarations_from_periods` | DeclarationSyncService |
| `sync_periods_from_declaration` | PeriodPropagationService |
| `auto_approve_if_matches_latest_validated_shift` | AutoApprovalPolicyService |
| `calculer_duree_periode` | **TimeUtilityService** / duration |
| `minutes_from_time` | TimeUtilityService (repo-only on hzppst) |
| `calculer_heures_cadre_chantier` | **TimesheetCalculationService** (repo-only; dump uses fixed 7h view) |
| View `synthese_heures_journalieres` | Calculation + sync input inside application |

**Rule:** Business hours logic **not** left in SQL triggers for Unified Platform (Imp-06 mission). Constraints UNIQUE/CHECK may remain in DB.

---

## 12. RPC Mapping (Timesheet-related)

| RPC | Status in CVL | Imp-06 |
|---|---|---|
| `delete_chantier_cascade` | Active; deletes periods/declarations first | Owned by Imp-04 (already); Timesheet must tolerate |
| `auto_approve_week_suggestion_replication` | Repo only; FE call **commented**; **absent hzppst** | **Defer** — Flow G inserts periods only; do not revive RPC without Decision |

---

## 13. Edge Function Mapping

| Edge | Timesheet? |
|---|---|
| `create-user` / `delete-user` | No (Imp-03) |

No Edge owns declare/validate.

---

## 14. API Mapping (Unified Platform design — FE Contract compatible)

Frozen FE today talks PostgREST on `periodes_travail` / `declarations_heures`. Imp-06 REST (or adapter Imp-12) must support equivalent operations:

| FE operation | Table/op | Backend API (proposed) |
|---|---|---|
| Insert periods (declare-day, timesheet, replicate) | INSERT periodes | `POST /api/timesheet/periods` (batch) |
| Update period | UPDATE | `PATCH /api/timesheet/periods/:id` |
| Delete period | DELETE | `DELETE /api/timesheet/periods/:id` |
| Select periods/declarations | SELECT | `GET /api/timesheet/periods`, `.../declarations` |
| Validate/reject declaration | UPDATE declarations | `POST /api/validation/declarations/:id/decide` (Imp-07 may own; Imp-06 provides sync services) |
| Cancel | UPDATE annulee + DELETE periods | Cancel use-case TX |
| Validate/reject period (chef-dashboard) | UPDATE periodes | Review path / Imp-07 |

Payload fields must match FE expectation (heures, GPS, panier, déplacement, statut, …) — **no FE edits**.

---

## 15. Frontend Screen Mapping

| Screen / util | Timesheet ops | Flow |
|---|---|---|
| `declare-day.tsx` | insert multi-day periods; overlap checks | D |
| `declare-day-suggestion.tsx` | accept suggestion inserts | D |
| `declare-day-empty.tsx` | read day | D |
| `timesheet.tsx` | CRUD periods + realtime | D |
| `ChooseDayCalendar.tsx` | status dots | D |
| `ouvrier-dashboard.tsx` | week read | D |
| `ouvrierDeclaration.ts` | habit + week replicate inserts | D/G |
| `services/periods.ts` | start/end/validate/reject period | D/E |
| `validation.tsx` | declare decide + cancel + sync periods | E |
| `chef-dashboard.tsx` | validate/reject **periods** direct | E |
| `export.tsx` / `user-payroll.tsx` | read validated | F |

Evidence: `frontend-supabase-usage.md`.

---

## 16. Error Cases (from evidence)

| Case | Expected behavior | Trace |
|---|---|---|
| Overlap / duplicate declaration day | UNIQUE or FE pre-check | FE declare-day; UNIQUE |
| Insert period for other user | Denied | RLS INSERT own |
| Update validated period as ouvrier | Denied | RLS UPDATE |
| Empty active periods after delete | Soft annulee **or** hard DELETE declaration | C-04 |
| Auto-approve no match | Leave `soumise` | auto_approve |
| Week RPC | Not called | commented FE |
| Chantier deleted mid-flight | Cascade removes periods/declarations | delete_chantier_cascade |
| Password/auth | Out of scope Imp-06 | Imp-02 |

---

## 17. Concurrency Risks & Strategies

| Scenario | Risk | Strategy (design — must be implemented) |
|---|---|---|
| Two submits same day/chantier | Race on UNIQUE declaration | TX + upsert idempotent on unique key; retry |
| Two chefs approve same declaration | Lost update | Conditional update `WHERE statut='soumise'`; version/statut check |
| Replicate week while editing day | Double periods / sync thrash | TX per day key; overlap pre-check like FE |
| Delete chantier during declare | FK/cascade | Imp-04 cascade order; TX fail closed |
| Delete user with periods | CASCADE profile | Imp-03; zone RESTRICT first |
| Assignment changes mid-week | Visibility changes | AuthZ checked each request; historical rows remain |
| Period close vs validation | Sync loop | Single write-path ownership; order: decision → propagate periods → recompute declaration once |
| Auto-approve vs chef approve | Double transition | Auto-approve only from `soumise`; chef update conditional |

---

## 18. Rollback Strategy

| Level | Action |
|---|---|
| In-TX failure | ROLLBACK entire declare/validate/cancel |
| Module deploy | Keep schema migration reversible notes; feature flag dual-run with Supabase until parity |
| Bad sync parity | Re-run DeclarationSyncService for day key from periods source of truth |
| Drift decision reverse | Switch calculation/cancel policy via config **after** DR — not silent SQL toggle |

---

## 19. Legacy → Unified traceability matrix (gate)

| Legacy | Unified | Trace OK? |
|---|---|---|
| trigger_sync_declarations | DeclarationSyncService | ✅ mapped |
| sync_declarations_from_periods | DeclarationSyncService | ✅ |
| trigger_sync_periods_from_declaration | PeriodPropagationService | ✅ |
| sync_periods_from_declaration | PeriodPropagationService | ✅ |
| trigger_auto_approve_* | AutoApprovalPolicyService | ✅ |
| calculer_duree_periode / cadre / minutes | TimeUtility + TimesheetCalculationService | ✅ mapped; **variant C-03 open** |
| RLS periods/declarations | requireAuth + requireRoles + scope services | ✅ outcomes |
| FE PostgREST writes | REST (+ Imp-12 adapter) | ✅ design |
| week RPC | Deferred | ✅ explicit |
| Edge | N/A timesheet | ✅ |

**Open product decisions (must not silently invent):** C-03, C-04, C-08, C-09 — see Decision Requests.

---

## 20. Decision Requests — RESOLVED

| ID | Winner | Binding |
|---|---|---|
| DR-IMP06-001 | Soft Annulee | No hard DELETE |
| DR-IMP06-002 | CADRE (+7h fallback) | Cadre when configured |
| DR-IMP06-003 | P+Fsplit | Omit nb_deplacements on sync; fix validated_by+at on auto-approve |

**Implementation:** UNBLOCKED.

---

## 21. Analysis Acceptance

| Criterion | Result |
|---|---|
| Business Goal / Actors / Lifecycle / State machines | ✅ |
| ER / Aggregate / TX / Permission / Validation | ✅ |
| Trigger / Function / RPC / Edge / API / FE screens | ✅ |
| Errors / Concurrency / Rollback | ✅ |
| Every SUMMARY timesheet rule traced | ✅ |
| No FE changes | ✅ |
| No code in this step | ✅ |
| Drift winners not invented | ✅ (DR opened) |

**TIMESHEET_DOMAIN_ANALYSIS: PASS**  
**Implementation: BLOCKED pending DR-IMP06-001 / 002 / 003**

---

## 22. Next step

1. Human answers DR-IMP06-001…003.  
2. Then Imp-06 implements in order: DTO → Validation → Domain → Repository → Application Service → Transaction → Controller → API → Migration.  
3. Full tests + reports → commit/push → Auto-Continue Imp-07.
