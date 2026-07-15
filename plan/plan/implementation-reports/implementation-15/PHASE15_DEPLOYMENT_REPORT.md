# PHASE15_DEPLOYMENT_REPORT.md

**Date:** 2026-07-15  

## Runtime topology

```
FE nginx (:16035) → Unified API (:3001) → Postgres demo (:5432, volume chantier_pg_data)
                                         ↘ (tests only) Postgres test (:5433, volume chantier_pg_test_data)
```

## Startup (verified)

```bash
cd api-chantier
docker compose -f docker-compose.yml -f docker-compose.phase13.yml up -d --build
npm run migrate
npm run seed:local
```

Observed after Phase 15 recreate:

| Container | Status |
|---|---|
| chantier-db | healthy |
| chantier-api | healthy |
| chantier-web | **healthy** |
| chantier-db-test | healthy (when test stack up) |

Isolation proof: demo `profiles` count **974** vs test DB **44** after full suite.

## Docs

- `api-chantier/DEPLOYMENT.md`
- `api-chantier/PRODUCTION_CHECKLIST.md`
- `api-chantier/PHASE13_LOCAL_RUN.md` (still valid; prefer DEPLOYMENT.md)
