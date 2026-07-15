# PHASE13_RUNTIME_DESIGN.md

**Date:** 2026-07-15  
**Mode:** Design  
**DR-P13-007 recommended: A** — FE + API + Postgres only  

---

## 1. Process topology

```
[Developer machine]
  ├─ docker compose: db (Postgres 16) + api (Express)
  └─ npx expo start (web and/or device → LAN IP)
```

Optional later: single reverse-proxy — **OPTIONAL**, not required for MVP.

---

## 2. Startup order

1. `docker compose up -d db` → healthy  
2. Migrate `001`…`010` (compose entry or `npm run migrate`)  
3. `npm run seed:local` (DR-P13-006)  
4. `docker compose up -d api` / `npm run dev`  
5. Configure FE `.env` → `EXPO_PUBLIC_API_URL=http://localhost:3000` (or LAN IP)  
6. `npx expo start`  
7. Login with seeded admin  

Shutdown: stop Expo → `docker compose down` (keep volume unless reset).

---

## 3. Environment (design)

### FE

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Unified+compat origin (replaces Supabase URL) |
| Remove committed cloud URL from `app.config.js` hardcode | **Must** |
| Anon key | Drop once supabase-js removed; if interim headers needed, static `"local-anon"` ignored by API |

### API (existing Compose)

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `API_PORT` — keep.  
CORS must allow Expo web origin and LAN.

### Not introduced

Redis URL, S3, SMTP, Supabase service role.

---

## 4. Developer workflow

```text
git clone …
cd api-chantier && npm i && cp .env.example .env
docker compose up -d --build
npm run migrate
npm run seed:local
# API listening :3000

cd ../chantier1/... && npm i
# set EXPO_PUBLIC_API_URL
npx expo start
# login seed user → smoke Flows A–G subset
```

Verify checklist (design):

- Login / logout / refresh  
- List chantiers / assign worker  
- Create period → declaration appears  
- Chef validate (Imp-07 path)  
- SSE reload or poll on timesheet  
- Edge create-user  

---

## 5. Data

| Concern | Design |
|---|---|
| Migrations | Existing Imp-01…11 SQL only |
| Seed | Deterministic UUIDs optional; password `secret12` hashed |
| Volume reset | `docker compose down -v` documented |
