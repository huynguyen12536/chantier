# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Rename / compatibility dictionary

| CVL name | Target name | Decision | Reason |
|---|---|---|---|
| `profiles` | `profiles` | Keep | Minimize frozen-FE contract divergence. |
| `chantiers` | `chantiers` | Keep | Same. |
| `affectations_chantiers` | `affectations_chantiers` | Keep | Same. |
| `periodes_travail` | `periodes_travail` | Keep | Same. |
| `declarations_heures` | `declarations_heures` | Keep | Same. |
| zone relations | existing zone names | Keep pending final schema mapping | Avoid speculative renames. |
| trigger/function internals | service/audit concepts | Transform | Target runtime is application-owned. |

Keeping names is a compatibility preference, not approval to expose direct database access to the frontend.
