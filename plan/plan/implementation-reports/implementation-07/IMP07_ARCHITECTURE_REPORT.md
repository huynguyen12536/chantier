# IMP07_ARCHITECTURE_REPORT — Review & Approval (Design)

**Role:** Architect (design only — implemented in subsequent Developer step)  
**Upstream:** Imp-06 frozen  
**SoT:** Unified Domain BC “Review & Approval”, Flow E, Rule Ownership, TARGET_DDL audit relation

---

## 1. Aggregate boundaries

- **ReviewDecision** owns declaration status transitions for human review.
- **PeriodDecision** owns direct period validate/reject (chef-dashboard CVL path).
- **Time Recording** owns period INSERT/UPDATE/DELETE by workers and declaration sync from periods (Imp-06) — Review must not re-own worker writes.
- **ApprovalHistory** is append-only satellite of ReviewDecision / PeriodDecision.

Crossing the boundary: Review may **call** Imp-06 `syncPeriodsFromDeclaration` and timesheet repository reads/`updatePeriod` for period decide — never duplicate sync SQL inside Review.

---

## 2. Decision workflow

```
Queue (soumise, scoped)
   ├─ Approve  → validee → PeriodPropagation
   ├─ Reject   → rejetee → PeriodPropagation
   ├─ Return   → rejetee (correction) → PeriodPropagation  [audit action=return]
   └─ Cancel   → annulee → DELETE related periods (Flow E)
```

Worker resubmit (`rejetee` period → `terminee`) remains Timesheet write path (SUMMARY #15).

---

## 3. State machine

### Declaration
`brouillon|derived → soumise → {validee | rejetee | annulee}`

| From | Action | To | Side effect |
|---|---|---|---|
| soumise | approve | validee | propagate periods |
| soumise | reject / return | rejetee | propagate periods |
| soumise \| validee | cancel | annulee | delete periods |
| * | second approve/reject | — | 409 CONFLICT |

### Period (direct)
`en_cours|terminee → validee|rejetee` (reviewer scoped)

---

## 4. Review ownership

| Concern | Owner |
|---|---|
| Human approve/reject/return/cancel | **Imp-07 ReviewDecisionService** |
| Period propagation on declaration decision | Imp-07 orchestrates; Imp-06 helper executes |
| Matching-shift auto-approve | Imp-06 AutoApproval (frozen) — not moved |
| Audit events (human) | Imp-07 AuditService |
| Notification contract hooks | Imp-07 NotificationHooks |
| Worker period CRUD | Imp-06 (frozen) |

**Single write path for human review:** all validation routes + frozen timesheet `/decide` delegate → ReviewDecisionService.

---

## 5. Authorization

| Role | Queue | Decide | History |
|---|---|---|---|
| ouvrier | ❌ | ❌ | own declaration only |
| chef_equipe | supervised chantiers | in-scope only | in-scope |
| administratif | all | all | all |
| admin | all | all | all |

Scope source: shared `chefScope.js` (Imp-05/06 parity — no redesign).

---

## 6. Transaction boundaries

One transaction per decision command:

1. Authorize + load  
2. Conditional status write  
3. Propagate or delete periods  
4. Append audit  

Notification hooks run **after COMMIT** (never inside SQL / never before durable commit).

---

## 7. Audit ownership

- Table: `approval_audit_events` (additive migration).
- Fields: id, entity_type, entity_id, declaration_id, action, from_statut, to_statut, actor_id, reason, correlation_id, created_at.
- Only Imp-07 writes audit rows.
- History API reads via repository + scope check.

---

## 8. Notification ownership

- Imp-07 owns **hooks** (`onDeclarationReviewed`, etc.).
- Transport (WebSocket/SSE/Realtime) deferred to Notification BC.
- No FE change; hooks enable future adapters.

---

## 9. Explicit non-goals

- No Imp-06 code changes  
- No FE changes  
- No SQL business triggers  
- No DR reopen  
- No column renames on timesheet tables  
- No lunch/bool_or redesign  
