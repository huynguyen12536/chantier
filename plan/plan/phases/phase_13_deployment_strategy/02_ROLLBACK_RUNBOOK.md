# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Rollback runbook — planned, not executed

Rollback triggers: critical authorization breach, unexplained integrity/reconciliation failure, material frozen-contract failure, unavailable Unified Platform write path, or declared RTO/RPO breach.

1. Stop Unified Platform writes and record the incident/correlation range.
2. Preserve evidence and final transaction boundary; do not delete target data.
3. Re-enable CVL Supabase writes only under the named rollback authority and only if source integrity is confirmed.
4. Restore/rebuild the target using approved backup/PITR/rehearsal procedure; reconcile the boundary before any retry.
5. Notify stakeholders, retain audit artifacts, conduct post-incident review, and reopen cutover only with corrected evidence.

Exact topology, RTO/RPO values, and operational command paths are implementation-wave inputs; this is not a completed rollback test.
