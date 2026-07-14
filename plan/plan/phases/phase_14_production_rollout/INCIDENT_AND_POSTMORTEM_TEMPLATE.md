# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Incident and postmortem template

Record: incident ID; start/end; affected flow(s) A–G; role/scope; frozen-contract impact; source/target data boundary; detection signal; mitigation/rollback decision; customer impact; evidence links; CVL rule trace; root cause; corrective/preventive actions; owner; due date; follow-up validation.

Any Pending Legacy Discovery concern is recorded as an evidence request, never retroactively assumed as a CVL defect.
