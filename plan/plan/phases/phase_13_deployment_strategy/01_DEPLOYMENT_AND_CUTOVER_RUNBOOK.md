# Consolidation design basis

**Terminology:** **Current Verified Legacy (CVL)** is the reverse-engineered workspace evidence; **Pending Legacy Discovery** has no asserted facts; the **Unified Platform** is the target.

**Boundary:** Documentation/planning only. The frontend is frozen: its Supabase RPC, Edge, table, auth, and realtime interaction patterns are compatibility requirements for future backend adapters. This material changes no frontend, CVL rule, production environment, database, or business module.

**Evidence:** `migration-analysis/business-flows.md` (flows A–G), `migration-analysis/merge/fe_contract_matrix.md`, `migration-analysis/merge/MERGE_DECISION_MATRIX.md`, Phase 4–8 design packs, and Decision O3.

# Deployment and cutover runbook — planned, not executed

## Entry gates
Named release owner, approved implementation/migration/test evidence, backup/PITR rehearsal, monitoring/alerting readiness, communications, a verified CVL source identity, and an approved change window.

## Runbook
1. Announce the maintenance window, freeze criteria, owners, customer communication, and rollback decision authority.
2. Deploy the approved Unified Platform release inactive; validate health, configuration, secret access, audit/log paths, and no client-visible write enablement.
3. Run pre-freeze read-only reconciliation against the explicitly identified CVL source.
4. Disable **CVL Supabase writes** through the approved operational control; verify that Edge, direct table, RPC, and privileged write paths reject writes while preserving evidence.
5. Capture the final delta/snapshot, execute approved import tooling, and pass reconciliation gates.
6. Enable Unified Platform writes and contract-equivalent events; keep CVL write controls in place.
7. Monitor errors, authorization denials, queue/retry behavior, time/declaration states, and export outputs during the defined verification window.
8. Declare cutover only after gates pass; preserve CVL read-only access/retention according to approved policy.

This runbook does not assert that any step has been executed.
