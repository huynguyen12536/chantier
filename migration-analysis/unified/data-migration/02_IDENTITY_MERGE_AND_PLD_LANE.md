# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Identity merge and Pending Legacy Discovery lane

For CVL, preserve immutable source identity and provenance. Candidate duplicate identities may be compared only on approved keys (for example normalized email plus independently reviewed supporting attributes); automatic merge is prohibited without an approved rule and audit record. Ambiguous identity, role, or ownership mappings enter a manual review queue and block dependent records.

Pending Legacy Discovery is **TBD**: before inclusion, collect its repository/dump, inventory, provenance, schema/rule/permission mapping, identity-key evidence, and a merge decision. It receives a separate source namespace and reconciliation baseline. No assumed rows, duplicate rules, or business semantics are created here.
