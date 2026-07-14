# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Unified Database Modeling

This pack is a PostgreSQL target **design**, not executable SQL and not an applied migration. It derives persistence from Phase 3 and Phase 4 while preserving the frozen frontend's existing table naming preference where feasible.
