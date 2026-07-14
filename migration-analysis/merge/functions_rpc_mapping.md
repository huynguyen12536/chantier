# Functions and RPC Mapping

| CVL function/RPC | Current purpose | Decision | Unified Platform candidate | Evidence |
|---|---|---|---|---|
| `sync_declarations_from_periods` | aggregate periods into declaration | Transform | Time Recording orchestration | `functions/sync_declarations_from_periods.md` |
| `sync_periods_from_declaration` | propagate declaration status | Transform | Review orchestration | `functions/sync_periods_from_declaration.md` |
| `auto_approve_if_matches_latest_validated_shift` | matching-shift approval | Transform | auto-approval policy | function/triggers docs |
| `delete_chantier_cascade` | delete dependent worksite data | Transform | audited worksite retirement service | `functions/delete_chantier_cascade.md` |
| `calculer_duree_periode` | calculate period duration | Keep/Transform | calculation policy | `functions/calculer_duree_periode.md` |
| `minutes_from_time` | time helper (repo-only) | Defer/Transform | calculation helper after drift decision | diff §8 |
| `calculer_heures_cadre_chantier` | cadre-hours calculation (repo-only) | Defer/Transform | schedule calculation policy | diff §3 |
| `get_chef_chantier_ids`, `is_admin`, `is_zone_owner`, `get_my_role` | authorization helpers | Transform | RBAC scoped authorization | `rls-analysis.md` |
| `auto_approve_week_suggestion_replication` | commented FE path; not dump deployed | Defer | product decision | Flow G; diff §8 |

No PLD function/RPC can be mapped without source evidence.
