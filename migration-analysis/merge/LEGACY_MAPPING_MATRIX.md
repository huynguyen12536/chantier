# Legacy Mapping Matrix

| CVL object | Unified Platform candidate | Mapping | Evidence | Pending Legacy Discovery extension |
|---|---|---|---|---|
| `auth.users` | Authentication Identity | Transform: external identity remains separate from workforce profile | `auth-flow.md` §1 | identity provider/origin mapping TBD |
| `profiles` | Workforce Member | Port with CVL roles and profile fields | `database-schema.md` §2.1 | additional roles/attributes TBD |
| `chantiers` | Worksite | Port; preserve frontend name at contract boundary | schema §2.2; Flow B | alternate worksite model TBD |
| `affectations_chantiers` | Worksite Assignment | Port, preserve unique worker/worksite and end date | SUMMARY §5 rule 4 | assignment types TBD |
| `zones_equipe` | Supervision Zone | Port as topology candidate | ER §2.3 | hierarchy model TBD |
| `zones_chantiers` | Zone–Worksite Link | Port as topology link | ER §2.3 | TBD |
| `zones_ouvriers` | Zone–Member Link | Port as topology link | ER §2.3 | TBD |
| `periodes_travail` | Work Period | Port as time-entry candidate | Flow D; ER §2.4 | source-specific fields TBD |
| `declarations_heures` | Daily Declaration | Port as daily aggregate candidate | SUMMARY §5 rules 5, 7 | alternative summary semantics TBD |
| `synthese_heures_journalieres` | Daily Time Calculation read model | Transform to governed read model/service | schema §3 | reporting requirements TBD |
| 3 triggers | Domain-event/service orchestration | Transform; preserve effects before changing mechanism | SUMMARY §8 | event variants TBD |
| SQL helpers/RPC | Domain services / calculation policy | Transform or retain as read calculation where appropriate | `migration-readiness.md` §2 | TBD |
| Edge `create-user`, `delete-user` | Provisioning and workforce lifecycle services | Transform | `auth-flow.md` §3–4 | TBD |
| RLS policies | RBAC + scoped authorization policy | Transform; retain CVL access outcomes until approved | `rls-analysis.md` | role/scope additions TBD |

No PLD object has been observed. “TBD” is a design extension, not a claim of equivalence.
