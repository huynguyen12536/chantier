# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Bounded contexts

| Context | Responsibilities | CVL evidence | Future-legacy extension |
|---|---|---|---|
| Identity & Access | User lifecycle, credentials, role/scope authorization. | Flows A, C; auth/RLS mappings | Add identity adapters and role mappings. |
| Worksite & Assignment | Worksites, assignments, team zones, retirement. | Flows B–C | Map additional location structures. |
| Time Recording | Period capture, daily declaration projection, replication request. | Flows D, G | Add source-specific time inputs as adapters. |
| Review & Approval | Queue, validate/reject/cancel, approval audit. | Flow E | Register policy variants by source. |
| Payroll Export | Authorized read/export of validated periods. | Flow F | Add export formats without changing recorded facts. |
| Notification | Contract-equivalent change notification. | Merge matrix realtime row | Select mechanism later; preserve contract need. |

Contexts communicate through explicit use-case boundaries; none exposes legacy triggers as a target contract.
