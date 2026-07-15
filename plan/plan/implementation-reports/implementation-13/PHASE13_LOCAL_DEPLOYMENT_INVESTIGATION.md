# PHASE13_LOCAL_DEPLOYMENT_INVESTIGATION.md

**Date:** 2026-07-15  
**Mode:** Investigation — how a developer launches the full local product  
**Current Compose:** `api-chantier/docker-compose.yml` (api + db only)

---

## 1. Existing local backend path (READY)

Documented / evidenced today:

```
cd api-chantier
docker compose up -d --build     # db + api
# migrations: run via container start or npm run migrate
npm test / npm run migrate       # depending on Dockerfile entry
```

Compose provides:

- Postgres 16 + volume  
- API image build from `Dockerfile`  
- Env: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, ports  

**Does not provide:** FE process, seed data UI, Redis, MinIO, Mail.

---

## 2. Proposed full startup sequence (investigation target)

Order matters:

| Step | Action | Owner |
|---|---|---|
| 1 | Start Postgres (healthy) | Compose `db` |
| 2 | Run SQL migrations `001`…`010` | `api-chantier` migrate CLI / boot |
| 3 | Optional seed (admin + demo users/chantiers) | **MISSING pack** → blocker |
| 4 | Start API (`api` service or `npm run dev`) | Express + `mountCompat` + jobs + SSE |
| 5 | Configure FE env / app config to local API base | **BLOCKED** (hardcoded cloud + freeze) |
| 6 | Start Expo (`npx expo start` / web) | FE |
| 7 | Login → exercise flows A–G | Manual / e2e later |

Imp-10 jobs start in-process with API (no separate worker).

---

## 3. Migrations

| Migration | Purpose |
|---|---|
| 001 | Platform bootstrap |
| 002 | Auth / profiles |
| 003 | Chantiers |
| 004 | Affectations / zones |
| 005 | Timesheet |
| 006–008 | Imp-05/06 parity |
| 009 | Imp-07 approval audit |
| 010 | Imp-11 phone / matricule UNIQUE |

All local; no Supabase migration runner required after cutover.

---

## 4. Seeds

| Source | Status |
|---|---|
| FE Edge `seed-test-users` | Exists under `chantier1/.../supabase/functions/` — **not** Unified; UI does not call |
| `api-chantier` seed script / SQL | **Not evidenced** as product seed |
| Tests insert ad-hoc profiles | Test-only |

**Blocker:** reproducible local demo seed (admin / chef / ouvrier + chantier) must be designed.

---

## 5. Developer launch (ideal DX — not implemented here)

Illustrative (Design later):

```text
1. cp api-chantier/.env.example .env
2. docker compose -f api-chantier/docker-compose.yml up -d
3. npm run migrate   # if not auto
4. npm run seed:local  # NOT EXISTS YET
5. Configure FE to http://localhost:3000
6. cd chantier1/... && npx expo start
```

Mobile device → use LAN IP + CORS.

---

## 6. Health / readiness

| Endpoint | Use |
|---|---|
| API health/ready (Imp-01) | Gate FE/proxy |
| `pg_isready` | Compose healthcheck already |

---

## 7. What Compose must eventually add (investigation opinion)

| Change | Class |
|---|---|
| Document FE start alongside API | Docs / DX |
| Seed job service or `npm run seed` | **BLOCKED** until designed |
| Redis / MinIO / Mail | **OUT** unless new evidence |
| Reverse proxy for single origin (optional) | Optional Design |

**Do not modify docker/** in this investigation.

---

## 8. Local vs cloud responsibilities after cutover

| Concern | Local |
|---|---|
| Auth / JWT | Imp-02 + local `JWT_SECRET` |
| Data | Local Postgres volume |
| Edge | Imp-12 routes on API |
| Realtime | Imp-09 SSE (FE adapt open) |
| Backups | Dev responsibility; not Phase 13 MVP |

---

## 9. STOP

Backend half of local deployment is **largely READY**.  
Full-product launch is **BLOCKED** on FE cutover policy, seeds, Realtime adaptation, and Imp-12 gap closures (by new DRs).
