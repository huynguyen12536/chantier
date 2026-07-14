# IMP08_CODE_CHANGE_REPORT

## Added

| Path | Purpose |
|---|---|
| `api-chantier/src/modules/export/dto.js` | FE field adapters |
| `plan/.../IMP08_*.md` | Implementation reports |

## Modified (Imp-08 only)

| Path | Purpose |
|---|---|
| `export/service.js` | payroll + stats total_heures + declarations |
| `export/controller.js` | declarations handler |
| `export/routes.js` | `GET /declarations` |
| `test/export.test.js` | FE fields, chef scope, declarations, range |

## Not changed

- Imp-05 / Imp-06 / Imp-07 modules
- Frontend
- Migrations (none required)
- Decision Logs for Imp-06 DRs
