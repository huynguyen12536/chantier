# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Cutover gates

- Mapping decisions trace every migrated capability to CVL evidence or approved Decision Request.
- The frozen frontend contract is tested against the Unified Platform.
- No dual write path remains without an authoritative owner.
- Backup/restore and rollback rehearsal have evidence.
- Reconciliation, authorization, approval transitions, and export outputs meet agreed thresholds.
- Pending Legacy Discovery is either explicitly excluded or has completed its merge lane.
