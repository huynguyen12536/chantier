# CODE_CHANGE_REPORT — Imp-01 Infrastructure

## New files
| File | Reason | Mapping |
|---|---|---|
| `api-chantier/src/shared/middleware/correlationId.js` | Observability ADR-001 | Architecture Platform |
| `api-chantier/src/shared/utils/logger.js` | Structured logs | Architecture Platform |
| `api-chantier/src/db/migrate.js` | Migration runner | Architecture Platform |
| `api-chantier/src/db/cli.js` | CLI entry | Architecture Platform |
| `api-chantier/migrations/001_platform_bootstrap.sql` | Bookkeeping table | Merge Spec deferred schema ownership to app |
| `api-chantier/test/infrastructure.test.js` | Unit/API smoke | Wave2 test gate |

## Modified files
| File | Why | Legacy/Merge/Arch |
|---|---|---|
| `src/app.js` | Mount correlation | Arch Platform |
| `src/shared/middleware/errorHandler.js` | Envelope + correlationId | Arch Platform |
| `src/modules/health/routes.js` | live/ready split | Arch Platform |
| `package.json` | test/migrate scripts | Arch Platform |

## Business rules
None.

## Frontend Contract
Unchanged. No FE files touched.
