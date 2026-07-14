# CODE_CHANGE_REPORT — Imp-06 Timesheet

## New files
| Path | Role |
|---|---|
| `api-chantier/migrations/005_timesheet.sql` | Tables `periodes_travail`, `declarations_heures`; system auto-approve actor |
| `api-chantier/src/modules/timesheet/dto.js` | Request/response shaping |
| `api-chantier/src/modules/timesheet/validation.js` | Input guards |
| `api-chantier/src/modules/timesheet/repository.js` | SQL only (no business rules) |
| `api-chantier/src/modules/timesheet/domain/timeUtility.js` | Duration / minutes helpers |
| `api-chantier/src/modules/timesheet/domain/calculation.js` | CADRE split + day synthesis |
| `api-chantier/src/modules/timesheet/services/declarationSync.js` | Soft Annulee sync |
| `api-chantier/src/modules/timesheet/services/periodPropagation.js` | Decision → periods |
| `api-chantier/src/modules/timesheet/services/autoApproval.js` | Matching-shift + audit fields |
| `api-chantier/src/modules/timesheet/services/timesheetService.js` | Orchestrator + TX |
| `api-chantier/src/modules/timesheet/controller.js` | HTTP handlers |
| `api-chantier/src/modules/timesheet/routes.js` | Router + RBAC for decide |
| `api-chantier/test/timesheet.test.js` | Unit + API regression |

## Modified files
| Path | Change |
|---|---|
| `api-chantier/src/app.js` | Mount `/api/timesheet` |
| `api-chantier/src/shared/db/pool.js` | `withTransaction` helper |
| Planning/merge/unified Imp-06 matrices | DR winners synchronized |

## Deleted
None (no FE files touched).

## Out of scope (deferred Imp-07+)
Dedicated review module surface beyond timesheet `decide`; period-only chef dashboard decisions; notifications; exports.
