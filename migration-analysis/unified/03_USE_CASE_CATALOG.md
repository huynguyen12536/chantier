# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Use-case catalog — flows A–G

| Flow | Unified use case | Actor | Outcome | Trace |
|---|---|---|---|---|
| A | Provision user | Authorized administrator | User identity and role are created under authorization checks. | `business-flows.md` 9–20 |
| B | Manage worksite and assignment | Authorized administrator | Worksite and time-bounded assignments are maintained; retirement is auditable. | 23–38 |
| C | Manage supervisor and zones | Authorized administrator/supervisor | Role transition and zones respect active-leadership constraints. | 42–53 |
| D | Record working time | Assigned worker | Period is captured and declaration lifecycle is synchronized through one owner. | 57–75 |
| E | Review declaration | Authorized reviewer | Declaration transition is audited and related periods are reconciled. | 78–99 |
| F | Export validated time | Authorized exporter | Read-only export contains validated in-range records. | 102–109 |
| G | Replicate week suggestion | Assigned worker | Source periods are copied through normal recording validation; inactive auto-approve RPC is not enabled. | 112–121 |

Flow H is excluded: it is a stated target without CVL code evidence and requires a future decision.
