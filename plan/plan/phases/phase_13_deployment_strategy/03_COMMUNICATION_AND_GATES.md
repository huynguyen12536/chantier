# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Communications and gates

Stakeholders: release owner, backend/data/security owners, support, authorized CVL operations owner, and business approver. Communications state the planned window, write freeze, service expectations, rollback threshold, support channel, and completion criteria.

No-go: unknown source identity, open critical/high security defect, failed contract suite, incomplete backup restore rehearsal, unbalanced reconciliation, unavailable rollback authority, or unresolved Pending Legacy Discovery inclusion.
