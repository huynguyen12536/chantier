# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Single write-path design

| Concern | Authoritative command owner | Required effect |
|---|---|---|
| Record/change/delete period | Time Recording | Validate actor/scope; transact period and declaration projection/reconciliation. |
| Validate/reject/cancel declaration | Review & Approval | Validate permission/state; transact declaration transition and affected-period reconciliation. |
| Auto-approve | Approval Policy invoked by authorized write path | Evaluate CVL condition explicitly; write audit decision. |
| Retire worksite | Worksite & Assignment | Check scope; retire/cascade only through auditable transaction. |

Controllers, jobs, notifications, and future legacy adapters invoke these commands; they do not write competing period/declaration state directly. This replaces CVL trigger plus frontend-redundancy patterns without changing the recorded CVL rules.
