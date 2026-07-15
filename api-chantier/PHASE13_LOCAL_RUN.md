# Phase 13 local stack (FE + API + Postgres)

## Start

```bash
cd api-chantier
docker compose -f docker-compose.yml -f docker-compose.phase13.yml up -d --build
npm run migrate
npm run seed:local
```

## Endpoints

| Service | URL |
|---|---|
| FE (web) | http://localhost:16035 |
| API | http://localhost:3001 |
| DB | localhost:5432 |

## Seed logins

Password for all: `Password123!`

- `admin@local.test` (admin)
- `chef@local.test` (chef_equipe)
- `ouvrier@local.test` (ouvrier)
- `administratif@local.test` (administratif)

FE is built with `EXPO_PUBLIC_API_URL=http://localhost:3001` (no hosted Supabase).
