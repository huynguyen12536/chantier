# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Pending Legacy Discovery merge lane

When a second legacy source becomes available: register source identity and access evidence; catalog schema/rules/auth/realtime/storage; compare it against the Merge Specification; add explicit Keep/Port/Drop/Defer decisions; extend domain/DB/logic mapping; run its own reconciliation rehearsal; only then add it to dual-run and freeze scope.

Until then, it remains a named extension point, not an inferred clone of CVL.
