# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Module order, Definition of Done, and security checkpoints

| Order | Module | Contract trace | Mandatory Definition of Done | Security review point |
|---|---|---|---|---|
| 1 | Platform | all | config validation, structured errors/logs, correlation IDs, health policy | secrets and log redaction |
| 2 | Identity & Access | A, C, F | JWT/refresh, role/scope middleware, lifecycle audit, compatibility session fixture | token lifecycle, privilege escalation, user deletion |
| 3 | Worksite & Assignment | B, C | transactional retirement, assignment and zone guards, adapter tests | object-level authorization |
| 4 | Time Recording | D, G | one write path, synchronization parity, idempotency/concurrency test | ownership, replay, integrity |
| 5 | Review & Approval | E | audited transitions and period reconciliation | vertical privilege, approval race |
| 6 | Payroll Export | F | validated/in-range/authorized query and export fixture | export authorization and data minimization |
| 7 | Notification | D, E | event scoping and reconnect contract test | subscription authorization |

Every module requires: CVL trace, API compatibility test, unit/integration/regression cases, migration impact assessed, observability, rollback behavior, review sign-off, and no unapproved frontend change.
