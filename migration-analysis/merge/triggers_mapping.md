# Trigger Mapping

| CVL trigger | Source event | Current effect | Unified Platform mapping | Parity obligation |
|---|---|---|---|---|
| `trigger_sync_declarations` | period insert/update/delete | derives/upserts daily declaration; **empty day → Soft Annulee (DR-IMP06-001)** | Time Recording `DeclarationSyncService` | rules 5–7; no hard DELETE |
| `trigger_sync_periods_from_declaration` | declaration status/validation update | propagates decision to related periods | Review `PeriodPropagationService` | rule 8; avoid FE/BE double-write divergence |
| `trigger_auto_approve_matching_latest_validated_shift` | declaration insert/update | optionally validates exact matching latest shift; **must set validated_by + validated_at (DR-IMP06-003)** | `AutoApprovalPolicyService` | rule 9 |

This maps mechanisms to domain orchestration. It does not authorize trigger removal until parity tests and drift decisions are approved.
