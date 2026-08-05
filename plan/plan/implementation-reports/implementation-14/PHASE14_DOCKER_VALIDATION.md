# PHASE14_DOCKER_VALIDATION.md

**Date:** 2026-07-15  
**Compose:** `api-chantier/docker-compose.yml` + `docker-compose.phase13.yml`

## Containers

| Name | Role | Host ports | Observed status |
|---|---|---|---|
| chantier-db | Postgres 16 | 5432 | healthy |
| chantier-api | Unified API | 3001→3000 | healthy |
| chantier-web | FE nginx static | 16035→80 | often **unhealthy** (see defect) while serving HTTP 200 |

## Restart / persistence test

Evidence:

1. `COUNT(*) profiles` before = **974**  
2. `docker compose … down` (~2315 ms) — containers removed  
3. `docker compose … up -d` (~12109 ms) — db healthy → api healthy → web started  
4. `/health` **200**, FE **200**  
5. `COUNT(*) profiles` after = **974** → **PERSIST=True** (volume `chantier_pg_data`)

Migrations remain applied (health lists 001–010).

## Logs / startup

API log pattern: `[db] connected` then listening; Imp-10 jobs runner starts.

## Seed / migrate

- `npm run migrate` → skipped already-applied  
- `npm run seed:local` previously created `@local.test` users (still present after restart)

## Verdict

**PASS** with residual **FE healthcheck false-negative** (container serves; Docker Health=unhealthy).
