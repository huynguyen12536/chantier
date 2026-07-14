# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Flow contracts A–G

| Flow | Contract operations | Authorization/compatibility |
|---|---|---|
| A — provision user | `POST /functions/create-user`, profile reads | Only CVL-authorized admin/administratif roles; password and matricule rules remain service-owned. |
| B — worksite and assignment | table adapters for worksite/assignment; `POST /rpc/delete_chantier_cascade` | Time-bounded assignment and deletion transaction retain CVL outcomes. |
| C — supervisor and zones | profile, assignment, zone table adapters | Demotion guard and scoped visibility remain enforced by backend policy. |
| D — record time | period/declaration adapters and events | Assigned worker scope; one backend-owned write path preserves synchronization behavior. |
| E — review declaration | declaration/period adapters and events | Chef/admin scopes; audit state transition and reconciliation guard. |
| F — export validated time | authorized read/query export endpoint (implementation task) | Only validated in-range records and CVL export roles. |
| G — replicate week | period creation adapter under normal validation | Inactive auto-approve RPC stays inactive; any matching-shift behavior follows CVL policy evidence. |

All error responses use `{ code, message, correlation_id }`; validation, authentication, authorization, conflict, and unexpected failures map to 400, 401, 403, 409, and 500 respectively. Mutating command idempotency key behavior is an implementation planning item, not a changed CVL rule.
