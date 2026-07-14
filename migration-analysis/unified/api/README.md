# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Unified Platform API contract pack

This pack specifies the future backend boundary while retaining the frozen frontend's observable Supabase interaction shapes through REST-compatible adapters. It is a contract design, not a server implementation or a request to modify frontend calls.

`openapi.yaml` provides canonical future routes. `FE_COMPATIBILITY_ADAPTERS.md` maps existing table, RPC, Edge, auth, and realtime patterns to adapters. `FLOW_CONTRACTS.md` traces every contract to CVL flows A–G.
