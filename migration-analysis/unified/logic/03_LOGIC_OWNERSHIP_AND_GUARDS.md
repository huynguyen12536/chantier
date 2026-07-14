# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Ownership and guards

- Identity lifecycle owns creation/deletion guards and role changes.
- Authorization policy owns role/scope checks previously represented through RLS outcomes.
- Calculation policy owns duration/cadre calculations and must record which verified variant it used.
- Notification observes committed changes only; it cannot mutate business state.
- Pending Legacy Discovery enters through a versioned adapter and mapping decision, never through a hidden second write path.
