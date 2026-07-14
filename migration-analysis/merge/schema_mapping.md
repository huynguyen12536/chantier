# Schema Mapping

Same CVL names are preferred at the frozen frontend contract boundary. Internal Unified Platform names below are candidates, not migrations.

| CVL table/view | Unified Platform target candidate | Boundary name | Decision | Evidence |
|---|---|---|---|---|
| `profiles` | Workforce Member | `profiles` preferred | Port/adapter | schema §2.1 |
| `chantiers` | Worksite | `chantiers` preferred | Port/adapter | schema §2.2 |
| `affectations_chantiers` | Worksite Assignment | same preferred | Port/adapter | ER §2.2 |
| `zones_equipe` | Supervision Zone | same preferred | Port/adapter | ER §2.3 |
| `zones_chantiers` | Zone Worksite Link | same preferred | Port/adapter | ER §2.3 |
| `zones_ouvriers` | Zone Member Link | same preferred | Port/adapter | ER §2.3 |
| `periodes_travail` | Work Period | same required by FE | Port/adapter | tables-used §1 |
| `declarations_heures` | Daily Declaration | same required by FE | Port/adapter | tables-used §1 |
| `synthese_heures_journalieres` | Daily Time Summary read model | internal or compatible view | Transform | schema §3 |

Future `tenant/company`, `legacy_origin`, and Super Admin structures are deferred extensions. They do not map from CVL tables because CVL has no evidence for them.
