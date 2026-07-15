# Production Verification Checklist (Phase 15)

Date: __________  Operator: __________  Git SHA: __________

## Docker

- [ ] `docker compose … up -d --build` succeeds
- [ ] `chantier-db` status **healthy**
- [ ] `chantier-api` status **healthy**
- [ ] `chantier-web` status **healthy**
- [ ] `docker compose … ps` shows expected ports (5432 / 3001 / 16035)
- [ ] Restart: `down` then `up` — data still present (seed users)

## Health / Logs / Resources

- [ ] `GET /health` → 200, `database: up`, migrations applied
- [ ] FE `GET /` → 200
- [ ] `docker logs chantier-api` — no crash loops
- [ ] `docker stats` — memory within host capacity
- [ ] Disk: Postgres volume writable

## Authentication

- [ ] `POST /auth/v1/token` password grant → 200
- [ ] `GET /auth/v1/user` → 200
- [ ] Refresh → 200; logout → 200; reuse refresh → 401
- [ ] Relogin works

## API / CRUD

- [ ] Profiles / users list (admin)
- [ ] Chantiers create/list/patch
- [ ] Affectations assign
- [ ] Zones list (if used)
- [ ] Period create (ouvrier) → declaration appears
- [ ] Declarations PATCH approve → `validee` (Imp-07)
- [ ] Export stats → 200
- [ ] Edge `POST /functions/v1/create-user` / `delete-user`
- [ ] RPC `delete_chantier_cascade`
- [ ] SSE `GET /events` → `event: connected`

## Frontend

- [ ] UI loads at `http://localhost:16035`
- [ ] Login screen against local API (no cloud host in Network tab)
- [ ] Bundle / config uses `EXPO_PUBLIC_API_URL` only

## Database

- [ ] Migrations 001–010 present
- [ ] Seed users `@local.test` present
- [ ] Demo DB port 5432 ≠ test DB port 5433

## Configuration hygiene

- [ ] No `EXPO_PUBLIC_SUPABASE_*` in active `eas.json` / compose / deploy workflow
- [ ] No hosted `*.supabase.co` URL in active deploy configs
- [ ] Legacy Edge sources only under `archive/` (marked obsolete)

## Regression

- [ ] `npm run docker:test:up && npm run migrate:test && npm test` → all green

## Sign-off

Result: PASS / FAIL  
Notes: ________________________________
