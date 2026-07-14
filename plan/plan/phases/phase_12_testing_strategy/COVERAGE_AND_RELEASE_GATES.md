# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Coverage and release gates

Before a rehearsal or release candidate: each CVL flow A–G has traceable unit, integration, contract, and E2E scenarios; every role has allow/deny coverage; state transitions include concurrency and rollback cases; Pending Legacy Discovery has no untested assumed behavior; migration reconciliation has no unexplained discrepancy; security review has no open critical/high release blocker; frozen frontend compatibility suite passes.

Defects are classified by CVL trace, contract impact, data integrity, security, and rollback effect. A critical rule, authorization, data-integrity, or compatibility regression blocks promotion.
