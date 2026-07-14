# LEGACY_MAPPING_MATRIX — Imp-06

Status: **Implemented & validated** (no SQL business triggers).

| Legacy | Unified Platform | Code | Notes |
|---|---|---|---|
| `trigger_sync_declarations` | DeclarationSyncService | `services/declarationSync.js` | Soft Annulee |
| `sync_declarations_from_periods` | DeclarationSyncService | same | No nb_deplacements write |
| `trigger_sync_periods_from_declaration` | PeriodPropagationService | `services/periodPropagation.js` | Imp-06/07 shared |
| `sync_periods_from_declaration` | PeriodPropagationService | same | |
| `trigger_auto_approve_*` | AutoApprovalPolicyService | `services/autoApproval.js` | validated_by+at required |
| `auto_approve_if_matches_latest_validated_shift` | AutoApprovalPolicyService | same | System actor audit |
| `calculer_duree_periode` / `minutes_from_time` | TimeUtilityService | `domain/timeUtility.js` | App code |
| `calculer_heures_cadre_chantier` | TimesheetCalculationService | `domain/calculation.js` | CADRE |
| View `synthese_heures_journalieres` | synthesizeDay | `domain/calculation.js` | No SQL view business |
| RLS periods/declarations | requireAuth + role + scope | routes/middleware | Outcomes preserved |
| FE PostgREST period CRUD | `/api/timesheet/*` | routes.js | FE Frozen; adapter later Imp-12 |
