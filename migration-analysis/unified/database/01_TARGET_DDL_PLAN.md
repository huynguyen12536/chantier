# Consolidation design basis

**Terminology:** Current Verified Legacy (CVL) is the reverse-engineered workspace evidence; Pending Legacy Discovery is a future merge input with no asserted facts; Unified Platform is the target.
**Authority:** Decision O3 and `migration-analysis/merge/`. **Frontend is FROZEN.** This pack changes no frontend, legacy fact, database, or backend service.
**Rule:** A CVL rule is preserved as evidence or explicitly deferred. No Pending Legacy behavior is invented; extension points remain open.

# Target DDL plan (design only)

No migration is created or applied in `api-chantier`.

| Target relation | Purpose / key design | Constraints and lifecycle |
|---|---|---|
| `profiles` | Contract-facing user profile, keyed to unified identity. | Unique identity reference; role/scope authorization derived outside direct client writes. |
| `chantiers` | Worksite aggregate. | Preserve `code` contract where feasible; retirement state/audit rather than unaudited cascade. |
| `affectations_chantiers` | User-worksite assignment. | FK profile/worksite; date-range validation; optional `chef_equipe_id`. |
| `zones_equipe`, `zones_chantiers`, `zones_ouvriers` | Team-zone scope structures. | Referential integrity and authorized lifecycle. |
| `periodes_travail` | Atomic recorded work period. | FK worksite/user; time/allowance data; status and audit fields. |
| `declarations_heures` | Daily reviewable declaration. | Unique owner/worksite/date identity as validated by final mapping; reviewer/time/status audit. |
| approval/audit event relation | Transition history and correlation. | Append-oriented, actor/time/reason/event version. |

Identity collision policy, final natural keys, and all Pending Legacy columns are deferred to Phase 11 mapping; no fact is synthesized here.
