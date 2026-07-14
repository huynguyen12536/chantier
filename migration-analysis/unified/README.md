# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Unified Domain Discovery

This is the Unified Platform domain-design pack derived from the Phase 3 merge specification. It translates CVL evidence into bounded contexts and use cases without making implementation decisions.

Read in order: glossary, bounded contexts, use cases, state machines, rule ownership.
