# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Future apply / rollback notes

This is a design sequencing note only: establish identities and reference data, then worksites/assignments/zones, then time records and declarations, then audit/history; reconcile before enabling each write path. A future migration must be reversible by release boundary and cannot disable legacy writes until Phase 8 acceptance criteria are met.
