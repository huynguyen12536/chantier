# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Final Migration Report

The completed planning packs define source-qualified CVL ETL stages, identity/manual-review safeguards, Pending Legacy Discovery intake, reconciliation gates, write freeze, cutover, and rollback runbooks. They do not select an unverified source as production or assert any migration has run.

No live data extraction, transformation, loading, reconciliation, freeze, cutover, rollback, or retirement was executed.
