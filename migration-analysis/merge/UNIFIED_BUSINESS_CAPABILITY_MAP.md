# Unified Business Capability Map

This map uses CVL evidence only. Proposed Unified Platform capabilities are not new rules.

| Flow | CVL capability | Unified Platform candidate | CVL evidence | PLD status |
|---|---|---|---|---|
| A | User provisioning and profile lifecycle | Identity & Workforce Administration | `business-flows.md` Flow A; `auth-flow.md` §3–4 | Extension pending |
| B | Worksite creation, assignment, retirement | Worksite & Assignment Management | Flow B; `entity-relationship.md` §2.2 | Extension pending |
| C | Supervisor promotion and team zones | Team Topology & Supervision | Flow C; ER §2.3 | Extension pending |
| D | Period capture, daily declaration, automatic aggregation | Time Capture & Daily Declaration | Flow D; SUMMARY §5 rules 5–10 | Extension pending |
| E | Validation, rejection, cancellation | Time Review & Decision | Flow E; SUMMARY §5 rules 7–8, 11, 15 | Extension pending |
| F | Validated-time export | Payroll Export & Reporting | Flow F; SUMMARY §5 rule 14 | Extension pending |
| G | Week suggestion/replication | Time-entry Assistance | Flow G; `frontend-supabase-usage.md` (commented RPC) | Extension pending |
| H | Company provisioning / platform administration | Platform Tenancy Administration | Flow H is greenfield; `00-IMPORTANT-FINDINGS.md` §1 | **Pending Legacy Discovery / future decision** |

## Capability boundaries

- Time Capture owns period commands; Daily Declaration is a derived daily read/write model governed by the documented synchronization rules.
- Worksite and Team Topology provide the assignment/zone scope consumed by Time Review.
- Identity supplies authenticated actor and CVL role information; authorization is a separate concern.
- Payroll Export reads validated time; it does not alter time status.
- Flow H is intentionally excluded from CVL parity obligations because no CVL evidence implements it.
