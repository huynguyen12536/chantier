# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# CVL ETL design

1. Snapshot an explicitly identified CVL source and record ref, extraction timestamp, checksum, schema version, and access owner.
2. Land immutable raw extracts; profile nulls, duplicates, IDs, and referential violations without mutating source.
3. Stage source-qualified records; map using the approved Unified database dictionary; retain provenance and source primary key.
4. Load reference/identity records before users, worksites, assignments/zones, periods, declarations, and export read-model inputs.
5. Quarantine unmapped, invalid, or ambiguous records with reason and review owner; do not silently drop.
6. Reconcile, approve, and only then make a rehearsal candidate available for cutover planning.

Actual column transforms, source selection, and execution scripts are deferred to the implementation wave.
