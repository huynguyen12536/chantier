# Wave 2 — Implementation Roadmap

**Status:** Started  
**Scope basis:** `migration-analysis/merge/`, `phases/phase_07_backend_architecture_design/ADR-001_UNIFIED_BACKEND_ARCHITECTURE.md`, and the Phase 10 implementation-planning backlog.  
**Operating rules:** `AGENTIC_EXECUTION_MANUAL.md`

## Scope guardrails

- Implement the Unified Platform incrementally while preserving the frozen frontend contract.
- **Explicitly deferred:** multi-company, `Company` entity, and Super Admin. These are out of scope under the Decision Log and require a new decision to enter a module.
- **Explicitly N/A / skipped:** Storage. CVL contains no storage capability; do not create a storage module without new evidence or a decision.
- Pending Legacy Discovery remains evidence-gated and does not create implementation work by inference.

## Module sequence

| ID | Module | Status | Depends On |
|---|---|---|---|
| Imp-01 | Infrastructure (Platform) | **Done — PASS** | — |
| Imp-02 | Authentication | **Done — PASS** | Imp-01 |
| Imp-03 | Users | **Done — PASS** | Imp-02 |
| Imp-04 | Construction Sites (chantiers) | **Done — PASS** | Imp-01, Imp-03 |
| Imp-05 | Assignments & Zones | **Done — PASS** | Imp-03, Imp-04 |
| Imp-06 | Timesheet | **Done PASS** | Imp-04, Imp-05 |
| Imp-07 | Review & Approval | **Done PASS** | Imp-06 |
| Imp-08 | Reporting & Export | In Progress | Imp-06, Imp-07 |
| Imp-09 | Notifications | Todo | Imp-02, Imp-07 |
| Imp-10 | Background Jobs | Todo | Imp-06, Imp-07, Imp-09 |
| Imp-11 | Administration | Todo | Imp-02, Imp-03 |
| Imp-12 | Integration Adapters (FE contract compatibility) | Todo | Imp-02–Imp-11 as applicable |
| Imp-13 | Production Readiness | Todo | Imp-01–Imp-12 |

## Module definitions

### Imp-01 — Infrastructure (Platform)
- **Status:** In Progress
- **Goal:** Establish the modular Express/PostgreSQL platform baseline: configuration, persistence boundary, error handling, health/readiness, structured logs, correlation IDs, metrics, and local Compose topology.
- **SoT refs:** ADR-001 §§Decision and Module map; `migration-analysis/merge/00_MERGE_OVERVIEW.md`; Phase 10 `PHASE.md`.
- **Depends On:** None.
- **Acceptance criteria:** A repeatable local platform starts without frontend changes; configuration and secret handling are safe; health/readiness and observability evidence exist; no business module is claimed implemented.

### Imp-02 — Authentication
- **Status:** Todo
- **Goal:** Implement JWT access and refresh-token lifecycle compatible with the frozen frontend authentication boundary.
- **SoT refs:** ADR-001 §§Decision and Module map; `migration-analysis/merge/auth_mapping.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-01.
- **Acceptance criteria:** Authentication flows are contract-tested; refresh lifecycle and failure paths are tested; no frontend contract change is required; authorization remains fail-closed.

### Imp-03 — Users
- **Status:** Todo
- **Goal:** Implement evidenced user lifecycle and role/scoped-access foundations for the single-tenant CVL scope.
- **SoT refs:** ADR-001 Identity & Access; `migration-analysis/merge/schema_mapping.md`; `migration-analysis/merge/permissions_mapping.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-02.
- **Acceptance criteria:** User CRUD/lifecycle and role checks trace to evidence; unauthorized paths are denied; tests cover lifecycle and access boundaries; no Company or Super Admin entity is introduced.

### Imp-04 — Construction Sites (chantiers)
- **Status:** Todo
- **Goal:** Implement construction-site lifecycle, integrity constraints, and evidenced retirement/deletion behavior.
- **SoT refs:** ADR-001 Worksite & Assignment; `migration-analysis/merge/schema_mapping.md`; `migration-analysis/merge/SHARED_BUSINESS_RULES.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-01, Imp-03.
- **Acceptance criteria:** Chantiers support contract-compatible reads/writes; integrity and deletion/retirement rules are tested; protected relationships follow CVL evidence.

### Imp-05 — Assignments & Zones
- **Status:** Todo
- **Goal:** Implement user-to-chantier assignments and zone behavior with scoped authorization.
- **SoT refs:** ADR-001 Worksite & Assignment; `migration-analysis/merge/schema_mapping.md`; `migration-analysis/merge/permissions_mapping.md`; `migration-analysis/merge/SHARED_BUSINESS_RULES.md`.
- **Depends On:** Imp-03, Imp-04.
- **Acceptance criteria:** Assignment and zone commands preserve evidenced constraints; scope checks are tested; frontend payload/response compatibility is proven.

### Imp-06 — Timesheet
- **Status:** Done PASS
- **Goal:** Implement time-recording period commands, declaration projection, and evidenced calculations in a single write path.
- **SoT refs:** ADR-001 Time Recording; `migration-analysis/merge/triggers_mapping.md`; `migration-analysis/merge/functions_rpc_mapping.md`; `migration-analysis/merge/SHARED_BUSINESS_RULES.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-04, Imp-05.
- **Acceptance criteria:** Timesheet writes are transactional and traceable; calculations and state rules are regression-tested; no trigger/RPC behavior is silently omitted; frozen FE contract passes integration tests.

### Imp-07 — Review & Approval
- **Status:** Done PASS
- **Goal:** Implement review transitions, approval policy, audit fields, and authorized approval commands.
- **SoT refs:** ADR-001 Review & Approval; `migration-analysis/merge/permissions_mapping.md`; `migration-analysis/merge/SHARED_BUSINESS_RULES.md`; `migration-analysis/merge/triggers_mapping.md`.
- **Depends On:** Imp-06.
- **Acceptance criteria:** Valid and invalid transitions are tested; approver identity/audit evidence is persisted; RBAC and scoped policy deny unauthorized approval; auto-approval behavior matches evidence or a decision.

### Imp-08 — Reporting & Export
- **Status:** In Progress
- **Goal:** Provide authorized validated-time reporting and export behavior without bypassing approval or scope policy.
- **SoT refs:** ADR-001 Payroll Export; `migration-analysis/merge/functions_rpc_mapping.md`; `migration-analysis/merge/permissions_mapping.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-06, Imp-07.
- **Acceptance criteria:** Reports/exports include only authorized validated data; format and contract compatibility are tested; audit and failure behavior are documented.

### Imp-09 — Notifications
- **Status:** Todo
- **Goal:** Implement contract-equivalent events for evidenced timesheet and validation notifications, with transport selected by implementation evidence.
- **SoT refs:** ADR-001 Notification; `migration-analysis/merge/realtime_mapping.md`; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-02, Imp-07.
- **Acceptance criteria:** Required events and recipients trace to CVL evidence; authorization and delivery failure behavior are tested; no unsupported realtime behavior is invented.

### Imp-10 — Background Jobs
- **Status:** Todo
- **Goal:** Implement reliable asynchronous processing required by approved domain events, reconciliation, or notifications.
- **SoT refs:** ADR-001 §§Decision and Consequences; `migration-analysis/merge/triggers_mapping.md`; `migration-analysis/merge/edge_functions_mapping.md`; Phase 10 backlog.
- **Depends On:** Imp-06, Imp-07, Imp-09.
- **Acceptance criteria:** Each job has an evidence-backed purpose, idempotency/retry/failure policy, observability, and integration tests; no legacy trigger is ported without a mapped service/event path.

### Imp-11 — Administration
- **Status:** Todo
- **Goal:** Implement only CVL-evidenced operational administration for users, roles, and supported configuration.
- **SoT refs:** ADR-001 Identity & Access; `migration-analysis/merge/permissions_mapping.md`; Decision Log scope decisions; `migration-analysis/merge/fe_contract_matrix.md`.
- **Depends On:** Imp-02, Imp-03.
- **Acceptance criteria:** Administrative actions are permission-scoped and auditable; FE compatibility is tested where exposed; multi-company and Super Admin capabilities remain absent.

### Imp-12 — Integration Adapters (FE contract compatibility)
- **Status:** Todo
- **Goal:** Complete and verify adapter endpoints, DTO mappings, error semantics, and event compatibility at the frozen frontend boundary.
- **SoT refs:** `migration-analysis/merge/fe_contract_matrix.md`; `migration-analysis/merge/LEGACY_MAPPING_MATRIX.md`; ADR-001 §Consequences.
- **Depends On:** Imp-02–Imp-11 as applicable.
- **Acceptance criteria:** Every supported frozen-FE interaction has an automated compatibility result; deviations have an approved Decision Request; no edit occurs under `chantier1/`.

### Imp-13 — Production Readiness
- **Status:** Todo
- **Goal:** Prove deployability, security, operational observability, migration/cutover readiness, and rollback readiness for implemented modules.
- **SoT refs:** ADR-001 §Decision; Phase 11–14 planning packs; `05_RISK_REGISTER.md`; Phase 10 backlog.
- **Depends On:** Imp-01–Imp-12.
- **Acceptance criteria:** CI/test/security/operational gates pass; migration and rollback rehearsals have evidence; unresolved environment-ref and secret risks are resolved or explicitly accepted; production readiness is not declared from documentation alone.

## Completion rule

Every module follows the full pipeline in `AGENTIC_EXECUTION_MANUAL.md` and writes evidence to `implementation-reports/implementation-NN/`. A module remains Todo/In Progress until all pipeline gates, commit, push, and recorded SHA are complete.
