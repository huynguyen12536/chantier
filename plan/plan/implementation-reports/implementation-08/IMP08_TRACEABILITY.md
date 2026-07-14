# IMP08_TRACEABILITY

| CVL / Unified | Code |
|---|---|
| Flow F | `modules/export/service.js` `listPayrollPeriods` |
| SUMMARY #14 | payroll filter `statut = 'validee'` |
| permissions_mapping canExport | `requireRoles` + `assertExporter` |
| FE export.tsx periods select | payroll DTO (`panier_repas`, profiles, chantiers) |
| FE export.tsx loadStats | `listExportStats` |
| FE user-payroll.tsx | `listUserDeclarations` |
| DR-002 CADRE for hours | import `splitHours` |
| Imp-06 storage `panier` | adapter only |

## Regression

Imp-05, Imp-06, Imp-07 suites remain green (48/48 total).
