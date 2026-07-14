# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Cutover playbook — CVL Supabase to Unified Platform

## Preconditions
1. Approved mapping/reconciliation criteria and a tested Unified Platform release.
2. Observability, backup restore exercise, access controls, and rollback owner available.
3. No Pending Legacy source is silently included; each newly discovered source uses the lane below.

## Stages
1. **Prepare:** inventory CVL snapshot boundary; deploy inactive Unified Platform; verify read-only reconciliation.
2. **Dual-run:** run legacy and Unified Platform in explicitly designated mode with one authoritative write owner per capability; compare defined reconciliation outputs.
3. **Freeze:** announce window; stop CVL writes; capture final delta and integrity checks.
4. **Cut over:** import/reconcile approved data; enable Unified Platform writes; maintain contract-equivalent notifications.
5. **Verify:** monitor errors, authorization denials, state-transition counts, and export parity.
6. **Retire:** only after acceptance, deprecate CVL write paths and record retention/access policy.

Do not treat `hzppst` or `afgveikz` as production identity: they are legacy evidence labels unless independently confirmed.
