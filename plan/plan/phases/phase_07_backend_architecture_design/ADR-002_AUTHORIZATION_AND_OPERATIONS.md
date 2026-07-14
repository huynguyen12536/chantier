# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# ADR-002 — Authorization and operations

Authentication is JWT-based; authorization is evaluated in application policy using roles and scoped relationships, preserving CVL outcomes rather than copying RLS implementation. Sensitive commands record actor, timestamp, correlation ID, target, and outcome.

Compose design includes backend, PostgreSQL, and observability-compatible interfaces. Secrets remain deployment configuration; no credentials are documented. Health/readiness, migration status, error taxonomy, metrics, and structured logs are required before cutover readiness.
