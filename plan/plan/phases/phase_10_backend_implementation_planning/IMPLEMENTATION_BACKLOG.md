# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Implementation backlog and milestones

## Milestone 0 — foundation and contract harness
Configuration/secrets, PostgreSQL access, JWT/refresh plumbing, error envelope, correlation IDs, contract fixtures, and adapter routing. **DoD:** no secrets in clients; OpenAPI linted; frozen contract fixture tests defined.

## Milestone 1 — identity and worksite capability
Implement user lifecycle (Flow A), profile adapter, worksite/assignment/zone commands (Flows B–C), RBAC/scope policy, and the cascade retirement transaction. **DoD:** role/guard tests, audit events, contract compatibility tests, security review approval.

## Milestone 2 — time recording and review
Implement one service-owned period/declaration write path, approval/rejection reconciliation, and compatible notifications (Flows D–E). **DoD:** transaction/rollback tests, concurrency/race tests, event-scope tests, regression trace against CVL.

## Milestone 3 — export and replication
Implement authorized validated-time export and normal-validation week replication (Flows F–G). **DoD:** range/role tests, export parity fixtures, inactive auto-approve RPC remains absent, security review approval.

## Milestone 4 — migration/cutover readiness
Build ETL tooling only from approved Phase 11 specifications; execute rehearsals, reconciliation, operational dashboards, and cutover gates. **DoD:** dry-run acceptance and Phase 12/13 gates approved.

No milestone authorizes production cutover or frontend changes.
