# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Reconciliation and rollback design

| Check | Gate |
|---|---|
| Extraction completeness | expected source tables and checksums recorded |
| Count parity | source, staged, loaded, rejected, and quarantined counts balance |
| Identity integrity | every merged/linked identity has source provenance and review decision |
| Referential integrity | no unexpected orphan FK; exceptions are quarantined |
| Time integrity | period/declaration counts, status totals, hours, and soft-cancel totals reconcile |
| Authorization integrity | role, assignment, and zone scopes have approved mappings |
| Export parity | fixture ranges produce approved validated-record totals |

Rehearsal rollback means discard/rebuild the isolated target from immutable extracts and preserve evidence; it never mutates CVL. Production rollback and PITR execution require the Phase 13 runbook and rehearsed evidence.
