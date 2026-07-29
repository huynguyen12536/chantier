# Production / Local Deployment Guide (Phase 15)

## System requirements

- Docker Engine + Docker Compose v2
- Node.js ≥ 20 (for migrate / seed / tests from host)
- Ports free: `5432` (demo DB), `3001` (API), `16035` (FE), `5433` (test DB only)

## Environment variables

### API (`api-chantier/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Demo Postgres | `postgres://chantier:chantier@localhost:5432/chantier` |
| `JWT_SECRET` | Imp-02 signing | long random string |
| `JWT_EXPIRES_IN` | Access TTL | `7d` |
| `CORS_ORIGIN` | Browser origins | `*` or explicit origin |
| `API_PORT` | Host publish port | `3001` |
| `POSTGRES_*` | Compose db service | user/password/db |

### Frontend build args / env

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Unified API origin (browser-reachable) |
| `EXPO_PUBLIC_API_ANON_KEY` | Optional header stub (`local-anon`) |

**Do not use** `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in active deploy configs.

### Tests only (`api-chantier/.env.test`)

Points at **isolated** DB `chantier_test` on port `5433` — never the demo volume.

## Docker startup (demo / production-local)

```bash
cd api-chantier
cp .env.example .env   # if needed; set JWT_SECRET
npm run docker:bootstrap
# equivalent:
#   npm run docker:up
#   npm run migrate
#   npm run seed:snapshot
```

`seed:snapshot` loads `seeds/current-snapshot.sql` (full current business data dump).

Endpoints:

- FE: http://localhost:16035  
- API: http://localhost:3001  
- DB: localhost:5432  

## Migration

```bash
npm run migrate
npm run migrate:status
```

## Seed

### Full current data (recommended local)

```bash
npm run seed:snapshot
# Reloads seeds/current-snapshot.sql (profiles, chantiers, affectations, periods, declarations, …)
# Passwords in snapshot match dump-time hashes (currently all set to 123456)
```

Rebuild snapshot from a running DB:

```bash
# after dumping with pg_dump into seeds/current-snapshot.raw.sql
npm run seed:snapshot:build
```

### Demo-only users

```bash
npm run seed:local
# Password: Password123!
# Users: admin@local.test, chef@local.test, ouvrier@local.test, administratif@local.test
```

Do **not** run `seed:local` after `seed:snapshot` unless you intentionally want demo users mixed in.
## Health verification

```bash
curl -sS http://127.0.0.1:3001/health
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:16035/
docker compose -f docker-compose.yml -f docker-compose.phase13.yml ps
# chantier-db, chantier-api, chantier-web should be healthy
```

## Automated tests (isolated DB)

```bash
npm run docker:test:up
npm run migrate:test
npm test
npm run docker:test:down   # optional
```

## Rollback

1. `docker compose -f docker-compose.yml -f docker-compose.phase13.yml down`  
2. Redeploy previous image tag / git checkout previous release SHA  
3. Volume `chantier_pg_data` persists data unless `docker compose down -v` (destructive)

## Troubleshooting

| Symptom | Check |
|---|---|
| FE unhealthy | Healthcheck must use `127.0.0.1` not `localhost` |
| API cannot reach DB | `DATABASE_URL` host `db` inside compose; `localhost` from host |
| Tests pollute demo | Ensure `.env.test` + port 5433; do not run tests against 5432 |
| CORS errors | Set `CORS_ORIGIN` to FE origin |
| Login fails after seed | Re-run `npm run seed:local` |

## Architecture (runtime)

```
Browser (FE nginx :16035)
  → Unified API (:3001)  [/auth/v1, /rest/v1, /functions/v1, /api/*, /events]
    → PostgreSQL (demo volume)
```

Business modules Imp-02…12 unchanged; compat is transport only.
