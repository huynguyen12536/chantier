# IMP07_TRACEABILITY

| CVL / Unified item | Imp-07 artifact |
|---|---|
| Flow E validation | `reviewDecision.js` approve/reject/return/cancel |
| Flow E cancel + Soft Annulee | cancel → `annulee` + DELETE periods; declaration kept |
| SUMMARY #8 sync periods | `periodPropagation.syncPeriodsFromDeclaration` (Imp-06 helper) |
| SUMMARY #11 chef scope | `chefScope.js` |
| Unified Review BC | `modules/validation/**` |
| TARGET_DDL approval audit | `009_imp07_approval_audit.sql` |
| Rule Ownership: declaration→period | Review orchestration owns human path |
| Realtime mapping (notification) | `notificationHooks.js` (transport deferred) |
| Period chef-dashboard path | `POST /api/validation/periods/:id/decide` |
| FE frozen decide body `{statut}` | `decideDeclaration` + body schema |
| DR-IMP06-001 Soft Annulee | Cancel keeps declaration |
| DR-IMP06-003 audit fields | `validated_by` / `validated_at` on human decide |

## APIs

| Endpoint | Trace |
|---|---|
| GET `/api/validation/queue` | Flow E queue |
| POST `.../approve` | validee |
| POST `.../reject` | rejetee |
| POST `.../return` | rejetee + audit return |
| POST `.../cancel` | annulee |
| GET `.../history` | audit read |
| POST `/api/validation/periods/:id/decide` | period path |
| POST `/api/timesheet/.../decide` | frozen delegate → Review |
