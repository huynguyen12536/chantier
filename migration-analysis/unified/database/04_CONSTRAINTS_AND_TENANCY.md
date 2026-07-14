# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Constraints, integrity, and tenancy extension

Target design uses foreign keys for recorded relationships, uniqueness for natural daily declaration identities once verified, check constraints for valid status values, and append-oriented audit evidence for sensitive transitions.

`company_id` is a **nullable deferred extension point** on tenant-scoped aggregates. It is not populated, required, or used for authorization in this phase because CVL contains no verified company behavior. Introducing tenancy requires a Decision Request, data backfill plan, FK/index design, and authorization review.
