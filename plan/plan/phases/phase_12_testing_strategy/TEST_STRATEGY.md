# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Unified Platform testing strategy

| Layer | Scope | Primary evidence/gate |
|---|---|---|
| Unit | policies, validations, state transitions, calculations, error mapping | every implementation rule traces to CVL or an approved decision |
| Integration | service/repository transactions, adapter boundaries, authorization, event scope | rollback, concurrency, and one-write-path behavior |
| Contract/regression | frozen auth/table/RPC/Edge/realtime usage and flows A–G | fixtures validate payload, status, error envelope, and permission outcomes |
| E2E | A provision; B/C worksite/zones; D record; E review; F export; G replicate | role-specific happy, denied, invalid, and lifecycle paths |
| Security | authn/z, session/token, secrets, input/query safety, audit, export, event isolation | critical/high findings block release |
| Migration | extract/stage/load/reconcile/rollback rehearsals | count, FK, identity, hours/status/export parity gates |

No test result is claimed by this strategy. Test data is synthetic or approved non-production material; no CVL business rule is redefined by a test.
