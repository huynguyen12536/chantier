# Functions and RPC Mapping

| CVL function/RPC | Current purpose | Decision | Unified Platform candidate | Evidence |
|---|---|---|---|---|
| `minutes_from_time` | time helper (repo-only) | **Transform** (DR-IMP06-002 CADRE) | TimeUtilityService | DR-IMP06-002 |
| `calculer_heures_cadre_chantier` | cadre-hours calculation (repo-only) | **Transform** (DR-IMP06-002 CADRE; fallback 7h) | TimesheetCalculationService | DR-IMP06-002 |
| `auto_approve_if_matches_latest_validated_shift` | matching-shift approval | Transform + **audit fix validated_by** (DR-IMP06-003) | AutoApprovalPolicyService | DR-IMP06-003 |
| `sync_declarations_from_periods` | aggregate periods into declaration | Transform + **Soft Annulee**; **omit nb_deplacements write** | DeclarationSyncService | DR-IMP06-001/003 |
| `get_chef_chantier_ids`, `is_admin`, `is_zone_owner`, `get_my_role` | authorization helpers | Transform | RBAC scoped authorization | `rls-analysis.md` |
| `auto_approve_week_suggestion_replication` | commented FE path; not dump deployed | Defer | product decision | Flow G; diff §8 |

No PLD function/RPC can be mapped without source evidence.
