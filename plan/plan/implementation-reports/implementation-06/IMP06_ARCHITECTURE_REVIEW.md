# IMP06_ARCHITECTURE_REVIEW — DDD / Layers / Boundaries

**Role:** Architecture Review (read-only)  
**Code under review:** `api-chantier/src/modules/timesheet/**` (+ decide delegation to `validation`)  
**Git:** `cddc4e452e` (Imp-06)

---

## 1. Intended architecture (from analysis)

- Time Recording owns period writes + declaration projection.  
- Review & Approval owns validate/reject/cancel (+ auto-approve policy).  
- No SQL business triggers; DB = persistence + constraint.  
- Single TX write path for period→sync→optional auto-approve.  

Evidence: TIMESHEET_DOMAIN_ANALYSIS §6–§11; ARCHITECTURE_REPORT.md.

---

## 2. Layer assessment

| Layer | Location | Assessment |
|---|---|---|
| Routes / Controller | `routes.js`, `controller.js` | Thin — OK |
| DTO | `dto.js` | Present; **wrong FE names** |
| Validation | `validation.js` zod | Present; weak vs dump |
| Application services | timesheetService, declarationSync, autoApproval, periodPropagation | Clear naming vs legacy — **PASS direction** |
| Domain | calculation, timeUtility | Pure-ish — OK |
| Repository | repository.js | SQL only — OK structurally |
| Shared TX | `withTransaction` in pool | OK |

**Circular dependency:** timesheetService → validation/reviewDecision; validation module may depend on timesheet repo/propagation. Imp-06 introduces cross-module decide. Risk of dual entry points (timesheet decide vs validation routes post Imp-07). **WARNING.**

---

## 3. Aggregate boundaries

| Aggregate | Boundary observed | Issue |
|---|---|---|
| DailyTimesheet | Sync by (user, chantier, date) inside TX | OK intent |
| WorkPeriod | CRUD by id | Writes without aggregate membership AuthZ |
| Declaration | upsert / decide | Soft Annulee only soumise; decide outside Time Recording OK |

Missing: explicit domain methods for invariants (open-state, GPS coherence) — pushed incompletely to DB.

---

## 4. Service boundaries vs Merge Spec ownership

| Service | Ownership claim | Reality |
|---|---|---|
| DeclarationSync | Time Recording | Correct placement |
| AutoApproval | Review policy | Co-located under timesheet module — acceptable Wave2; should be review-owned long-term |
| PeriodPropagation | Review path | Under timesheet; decide delegates to validation — **split** |
| TimesheetService orchestrator | Time Recording | Correct |

`05_RULE_OWNERSHIP.md` / analysis: Review owns decisions. Having `POST /timesheet/.../decide` in Imp-06 blurs capability boundaries with Imp-07. Documented as temporary — still an architecture debt.

---

## 5. Repository / transaction boundary

| Use case | Single TX? | Evidence |
|---|---|---|
| Create/update/delete period + sync + auto-approve | YES | timesheetService + afterPeriodChange |
| Decide + propagate | YES (via reviewDecide) | TRANSACTION_BOUNDARY claim |

Missing from architecture:

- Isolation level / lock strategy (`SELECT FOR UPDATE` on declaration key) — Analysis §17 mentioned; not designed into repository API.  
- Idempotent client key for batch declare.  
- Outbox / realtime event after commit.

---

## 6. Dependency direction

```
routes → controller → timesheetService → {repo, declarationSync, autoApproval}
                                    ↘ validation.reviewDecide → propagation
declarationSync → calculation + repo
autoApproval → repo + periodPropagation
```

No domain→HTTP cycle. Good.

Unauthorized “god” permission in application layer (`assertCanWritePeriod`) substitutes for missing AuthZ service (`chefScope` appears only later). Boundary leak: AuthZ incomplete inside orchestrator.

---

## 7. Architecture scorecard

| Criterion | Result |
|---|---|
| Trigger elimination into services | **PASS** |
| Single write path period→declaration | **PASS** |
| Aggregate conceptual model | **PASS** (design) |
| AuthZ as first-class boundary | **FAIL** |
| FE adapter as first-class boundary | **FAIL** / deferred without Decision |
| Imp-06 vs Imp-07 capability split | **WARNING** |
| DB migration as persistence-only | **PASS** (intent); schema content **FAIL** vs dump |

**Architecture direction: PASS. Architecture completeness for Imp-06 exit: FAIL.**
