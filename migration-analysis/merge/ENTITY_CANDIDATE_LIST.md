# Entity Candidate List

Candidates below describe business concepts for the Unified Platform. They are not generated models, database tables, APIs, or a final domain model.

| Candidate | CVL source | Purpose | Status |
|---|---|---|---|
| Authenticated Identity | `auth.users` | credential/session identity | contract-facing candidate |
| Workforce Member | `profiles` | person profile and CVL role | preserve candidate |
| Worksite | `chantiers` | site and working-hour frame | preserve candidate |
| Worksite Assignment | `affectations_chantiers` | worker/site/supervisor placement | preserve candidate |
| Supervision Zone | `zones_equipe` | chef-managed team boundary | preserve candidate |
| Zone Worksite Membership | `zones_chantiers` | site linked to zone | preserve candidate |
| Zone Worker Membership | `zones_ouvriers` | worker linked to zone | preserve candidate |
| Work Period | `periodes_travail` | individual time interval/GPS/allowance data | preserve candidate |
| Daily Declaration | `declarations_heures` | daily aggregate/review state | preserve candidate |
| Daily Time Summary | `synthese_heures_journalieres` | derived calculation/read model | transform candidate |
| Approval Decision | derived from declaration/period status | audit-friendly review action concept | proposal |
| Tenant/Company | absent in CVL | future isolation/provisioning boundary | deferred |
| Legacy Origin | absent in CVL | source provenance for a later merge | deferred |

Candidate attribute details and constraints remain governed by CVL mapping and Phase 4 confirmation.
