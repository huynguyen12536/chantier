# API_COVERAGE — Imp-07

| Method | Path | Roles |
|---|---|---|
| GET | `/api/validation/queue` | admin, administratif, chef_equipe (scoped) |
| POST | `/api/validation/declarations/:id/approve` | same |
| POST | `/api/validation/declarations/:id/reject` | same |
| POST | `/api/validation/declarations/:id/cancel` | same |
| POST | `/api/validation/periods/:id/decide` | same |
| POST | `/api/timesheet/declarations/:id/decide` | delegates to same service |

FE Frozen — PostgREST outcomes preserved via these adapters.
