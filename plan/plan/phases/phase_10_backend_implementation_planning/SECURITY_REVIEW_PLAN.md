# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Security review gates

Review before merge of each module and again before any rehearsal: authentication token handling; RBAC plus worksite/zone ownership; input validation; transaction boundaries; idempotency/replay; sensitive audit logs; secret rotation/removal for the historical `env` exposure; export minimization; realtime event scope; SQL injection and unsafe query construction; dependency/vulnerability checks.

Critical findings, CVL rule conflicts, or frozen-contract incompatibility block the implementation wave. Pending Legacy Discovery introduces no assumed role or data rule.
