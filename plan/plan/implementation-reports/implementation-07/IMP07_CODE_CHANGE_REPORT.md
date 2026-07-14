# IMP07_CODE_CHANGE_REPORT

## Constraint

**Imp-06 frozen — zero modifications** under `modules/timesheet/**` and Imp-06 migrations.

## Added

| Path | Purpose |
|---|---|
| `api-chantier/migrations/009_imp07_approval_audit.sql` | Additive audit table |
| `api-chantier/src/modules/validation/repository.js` | Persistence |
| `api-chantier/src/modules/validation/services/decisionPolicy.js` | Transitions / roles |
| `api-chantier/src/modules/validation/services/auditService.js` | Append audit |
| `api-chantier/src/modules/validation/services/notificationHooks.js` | Post-commit hooks |
| `api-chantier/test/validation.unit.test.js` | Policy + hooks units |

## Modified

| Path | Purpose |
|---|---|
| `validation/services/reviewDecision.js` | Full workflow + audit + hooks |
| `validation/routes.js` | return + history |
| `validation/controller.js` | New handlers |
| `validation/validation.js` | Body schema + reason |
| `validation/dto.js` | `mapAuditEvent` |
| `test/validation.test.js` | Return/history/audit/permission cases |

## Reports (plan)

`IMP07_IMPLEMENTATION_PLAN.md`, `IMP07_ARCHITECTURE_REPORT.md`, `IMP07_IMPLEMENTATION_REPORT.md`, `IMP07_BUSINESS_VALIDATION.md`, `IMP07_TRACEABILITY.md`, `IMP07_CODE_CHANGE_REPORT.md`

## Not changed

Frontend · Imp-06 · DR logs · migrations 001–008 · export module (Imp-08 already present)
