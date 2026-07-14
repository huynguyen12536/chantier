# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# ADR-001 — Unified Backend Architecture

**Status:** Accepted for design; implementation remains out of scope.
**Context:** The Unified Platform replaces Supabase runtime behavior while the existing frontend contract is frozen.

## Decision
- Use modular Express in `api-chantier/` as the target application boundary.
- Use PostgreSQL as target persistence; database constraints support integrity, while business orchestration is service-owned. **Wave 2:** schema evolution follows `DATABASE_EVOLUTION_POLICY.md` (UNION database; additive default; absence is not evidence).
- Use JWT access tokens with refresh-token lifecycle design; authenticate once, authorize per command/query using RBAC plus scoped policy.
- Compose is the canonical local topology for backend dependencies; exact deployment topology is deferred.
- Emit structured logs, correlation IDs, health/readiness signals, metrics, and auditable sensitive transitions.

## Module map
| Module | Responsibility |
|---|---|
| Identity & Access | JWT/refresh lifecycle, user lifecycle, RBAC/scope checks |
| Worksite & Assignment | Worksites, assignments, zones, retirement |
| Time Recording | Period commands and declaration projection |
| Review & Approval | Review transitions and approval policy |
| Payroll Export | Authorized validated-time reads/exports |
| Notification | Contract-equivalent events; transport selected later |
| Platform | configuration, persistence, errors, observability |

## Consequences
Every Phase 6 Port item has a module owner. Direct frontend database writes, PostgREST cloning, and distributed trigger/Edge orchestration are rejected. Existing scaffold files are not evidence that architecture or business implementation is done.
