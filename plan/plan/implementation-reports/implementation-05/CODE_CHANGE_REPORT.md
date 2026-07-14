# CODE_CHANGE_REPORT — Imp-05 Parity Patch

## Files modified / added

| File | Change | Why (CVL) | API impact | FE | Imp-06 |
|---|---|---|---|---|---|
| `migrations/006_imp05_parity.sql` | CHECK, indexes, description, drop UNIQUE zones_ouvriers | dump schema | none (DDL) | no | no |
| `src/modules/affectations/service.js` | chef write; scoped list; date refine | rls §62–66 | list now scoped | no | no |
| `src/modules/affectations/routes.js` | roles + chef | dump INSERT policies | chef can POST/PATCH | no | no |
| `src/modules/affectations/controller.js` | pass `req.user` to list | scoped query | same path | no | no |
| `src/modules/zones/service.js` | **new** ownership + Flow C lifecycle | rls §99–117, Flow C | new endpoints | no | no |
| `src/modules/zones/controller.js` | **new** | same | same | no | no |
| `src/modules/zones/routes.js` | remove administratif; add update/delete/unlink | CVL admin-only + chef | more zone routes | no | no |
| `src/db/migrate.js` | advisory lock | test isolation | none | no | no |
| `test/affectations_zones.test.js` | parity suites | DoD | n/a | no | no |

## Functions touched
- `listAffectations`, `assignUser`, `softRemoveAffectation`
- Zone: `listZones`, `createZone`, `updateZone`, `deleteZone`, `linkZoneChantier`, `unlinkZoneChantier`, `addZoneOuvrier`, `softRemoveZoneOuvrier`, `unlinkZoneOuvrier`, `assertCanManageZone`

## Mapping
- `migration-analysis/rls-analysis.md`
- `migration-analysis/production-dump/01_public_schema.sql`
- `migration-analysis/business-flows.md` Flow C
- `migration-analysis/database-schema.md` §2.3 / zones
- SUMMARY rules #4, #11–12

## API / FE / Imp-06
- API: additive zone lifecycle + stricter RBAC/scope (breaking for administratif zone writes — intentional CVL correction)
- FE: not modified
- Imp-06: not modified
