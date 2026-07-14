# Trigger Mapping

| CVL trigger | Source event | Current effect | Unified Platform mapping | Parity obligation |
|---|---|---|---|---|
| `trigger_sync_declarations` | period insert/update/delete | derives/upserts daily declaration; deletion/cancel behavior has drift | Time Recording service transaction emits/handles `WorkPeriodChanged` | rules 5–7 and CVL drift decision |
| `trigger_sync_periods_from_declaration` | declaration status/validation update | propagates decision to related periods | Review & Approval service emits/handles `DeclarationDecisionApplied` | rule 8; avoid FE/BE double-write divergence |
| `trigger_auto_approve_matching_latest_validated_shift` | declaration insert/update | optionally validates exact matching latest shift | explicit Auto-Approval policy evaluation | rule 9; document missing validator |

This maps mechanisms to domain orchestration. It does not authorize trigger removal until parity tests and drift decisions are approved.
