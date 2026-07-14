# IMP07_IMPLEMENTATION_PLAN — Review & Approval Domain

**Module:** Imp-07 Review & Approval  
**Upstream:** Imp-06 Timesheet — **FROZEN** (no redesign / no source edits)  
**SoT:** `migration-analysis/` (SUMMARY, business-flows Flow E, rls-analysis, functions/triggers, production-dump), Merge Spec, Unified Domain, Rule Ownership, Decision Logs (DR-IMP06-001/002/003 closed)  
**FE:** Frozen — backend REST adapters under `/api/validation/*`

---

## 1. Aggregate

| Aggregate | Root | Consistency boundary |
|---|---|---|
| **ReviewDecision** | `declarations_heures` (reviewable day) | Decision transition + period reconciliation + audit append + notification hook — one DB transaction |
| **PeriodDecision** | `periodes_travail` (chef-dashboard path) | Direct period validate/reject + audit — one TX; does not invent declaration sync beyond CVL period path |
| **ReviewQueue** | Read model | `statut = soumise` filtered by reviewer scope |
| **ApprovalHistory** | `approval_audit_events` | Append-only; never mutated |

---

## 2. Entities

| Entity | Persistence | Notes |
|---|---|---|
| Declaration under review | `declarations_heures` | Imp-06 schema; Imp-07 owns transitions |
| Work period (propagated / decided) | `periodes_travail` | Propagation via existing Imp-06 `syncPeriodsFromDeclaration` (call only) |
| Approval audit event | `approval_audit_events` (**new additive**) | actor, action, from/to statut, reason, correlation |
| Notification outbox (in-process hook) | none (callback registry) | Contract-equivalent refresh signal; mechanism later |

---

## 3. Services

| Service | Responsibility |
|---|---|
| `ReviewDecisionService` | approve / reject / return / cancel; concurrency; orchestration |
| `DecisionPolicy` | Allowed transitions, role gates, cancel period reconciliation rules |
| `PeriodPropagation` | **Reuse** Imp-06 `syncPeriodsFromDeclaration` — not reimplemented |
| `AuditService` | Append audit rows inside same TX |
| `NotificationHooks` | Fire after successful commit (approve/reject/return/cancel/period decide) |
| `ReviewQueueService` | Scoped list of `soumise` |
| `ReviewHistoryService` | History by declaration id (scope-checked) |

---

## 4. Policies

| Policy | Rule |
|---|---|
| Role | Reviewers: `admin`, `administratif`, `chef_equipe`. Worker: never decide |
| Scope | Chef: affectation ∪ zone ∪ supervised (`getChefChantierIds`). Admin/administratif: full business |
| Transition | `soumise` → `validee` \| `rejetee`; cancel from `soumise` \| `validee` → `annulee` |
| Return | CVL has no distinct statut — **Return = reject for correction** (`rejetee`) with audit action `return` (SUMMARY #15 resubmit path owned by Timesheet write) |
| Cancel | Declaration kept `annulee` (Soft Annulee); related periods **DELETE** (Flow E) |
| Concurrency | Conditional UPDATE from expected statut → 409 CONFLICT |
| Auto-approve | Remains Imp-06 frozen policy; Imp-07 audits **human** decisions only (accepted during freeze) |

---

## 5. Transactions

```
BEGIN
  load declaration/period + assert scope
  apply conditional status update
  propagate periods OR delete periods (cancel)
  INSERT approval_audit_events
COMMIT
→ notification hook (after commit)
```

Rollback: any failure before COMMIT leaves declaration/periods/audit unchanged.

---

## 6. APIs (FE-compatible shapes via DTO)

| Method | Path | Action |
|---|---|---|
| GET | `/api/validation/queue` | Scoped soumise queue |
| POST | `/api/validation/declarations/:id/approve` | → `validee` + propagate |
| POST | `/api/validation/declarations/:id/reject` | → `rejetee` + propagate |
| POST | `/api/validation/declarations/:id/return` | → `rejetee` (return) + propagate |
| POST | `/api/validation/declarations/:id/cancel` | → `annulee` + delete periods |
| GET | `/api/validation/declarations/:id/history` | Audit history |
| POST | `/api/validation/periods/:id/decide` | Period-only validate/reject |

Existing Imp-06 `POST /api/timesheet/declarations/:id/decide` remains a thin delegate (frozen) into ReviewDecisionService.

---

## 7. Events / notification hooks

| Event | When | Payload (minimal) |
|---|---|---|
| `declaration.reviewed` | approve/reject/return | declaration_id, statut, actor_id |
| `declaration.cancelled` | cancel | declaration_id, actor_id |
| `period.reviewed` | period decide | period_id, statut, actor_id |

Hooks are in-process subscribers; realtime transport deferred (Notification BC).

---

## 8. Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Dual entry timesheet decide vs validation | Single service owner; Imp-06 frozen delegate only |
| R2 | Cancel DELETE periods vs Soft Annulee confusion | Soft Annulee = declaration; Flow E cancel = hard-delete periods |
| R3 | Auto-approve without audit rows | Accepted under Imp-06 freeze; document drift |
| R4 | Chef global access | Reuse Imp-06 parity chefScope — no redesign |
| R5 | Inventing Return statut | Map to `rejetee` + audit action |

---

## 9. Dependency graph

```
Identity (auth/RBAC)
    ↓
Worksite/Assignment/Zone (chefScope, affectations)  [Imp-05]
    ↓
Timesheet (period/declaration persistence, propagation helper) [Imp-06 FROZEN]
    ↓
Review & Approval (this module) → Audit table → Notification hooks
    ↓
Payroll Export [Imp-08] consumes validated periods (read-only)
```

**Do not modify:** Imp-06 sources, FE, DR-001/002/003, existing migrations 001–008 (rewrite forbidden).

---

## 10. Delivery checklist

- [ ] Additive migration `009_imp07_approval_audit.sql`
- [ ] Repository / DecisionPolicy / Audit / Notification / ReviewDecision
- [ ] Routes: return + history
- [ ] Unit + integration + regression (permission, workflow, concurrency, rollback, audit, lifecycle)
- [ ] Reports IMP07_*
- [ ] Independent gates → commit → push → Status Board
