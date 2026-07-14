# LEGACY_MAPPING_MATRIX — Imp-07

| Legacy | Unified | Code |
|---|---|---|
| FE `validation.tsx` UPDATE declaration | ReviewDecisionService | approve/reject/cancel |
| FE redundant period UPDATE after decide | PeriodPropagationService | single BE path |
| FE cancel DELETE periods | cancelDeclaration | keeps declaration |
| chef-dashboard period UPDATE | decidePeriod | `/api/validation/periods/:id/decide` |
| `get_chef_chantier_ids` | chefScope | authz helper |
| RLS chef review | requireRoles + scope | routes + assertCanReviewChantier |
| `trigger_sync_periods_from_declaration` | PeriodPropagationService | reused from Imp-06 |
