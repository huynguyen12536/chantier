# PHASE13_RUNTIME_ARCHITECTURE.md

**Date:** 2026-07-15  
**Mode:** Investigation — target local composition (no Docker/code edits here)

---

## 1. Target local system

```
┌─────────────────────────┐
│  Expo FE (web / device) │
│  chantier1/             │
└───────────┬─────────────┘
            │ HTTP(S)  (+ SSE later)
            ▼
┌─────────────────────────┐
│  api-chantier (Express) │
│  Unified REST /api/*    │
│  Compat mountCompat     │
│  Imp-09 GET /events     │
│  Imp-10 in-process jobs │
└───────────┬─────────────┘
            │ DATABASE_URL
            ▼
┌─────────────────────────┐
│  PostgreSQL 16          │
│  migrations 001–010     │
└─────────────────────────┘
```

---

## 2. Service inventory

| Service | Required for CVL local product? | Current state | Notes |
|---|---|---|---|
| **Frontend (Expo)** | **YES** | Repo `chantier1/` | Dev: `npx expo start` / web |
| **API (Express)** | **YES** | `api-chantier` Compose service | Port 3000 |
| **PostgreSQL** | **YES** | Compose `db` | Port 5432; volume `chantier_pg_data` |
| **Redis** | **NO** for CVL now | Not in Compose | Imp-10 queue = in-memory; Imp-09 no Redis |
| **MinIO / Object storage** | **NO** | Not evidenced | Storage N/A |
| **Mail (SMTP/Mailhog)** | **NO** | Not evidenced | No invite/reset mail in FE inventory |
| **Supabase stack (GoTrue, PostgREST, Realtime, Kong)** | **REPLACE / DROP** | Cloud today | Goal: unused after cutover |
| **Kafka / workers** | **NO** | Imp-10 in-process | Wave C deferred |

---

## 3. Compatibility mounting (already in api process)

Same Node process as Unified API (`mountCompat` in `app.js`):

| Mount | Purpose |
|---|---|
| `/functions`, `/functions/v1` | Edge adapters |
| `/rpc`, `/rest/v1/rpc` | RPC cascade |
| `/tables/*`, `/rest/v1/*` | Table adapters |
| `/auth/v1/*` | Thin auth |
| `/api/*` | Primary Unified REST |
| `/events` | Imp-09 SSE |

No separate “compat gateway” container required for investigation baseline.

---

## 4. Network / client access

| Client | Typical URL | Notes |
|---|---|---|
| Expo Web (localhost) | `http://localhost:3000` | Set as API base |
| Expo Go on LAN device | `http://<dev-lan-ip>:3000` | CORS + firewall; not `localhost` |
| Hardcoded cloud URL | `https://afgveikzneaablcuzwdb.supabase.co` | **Must stop** for cutover |

Anon key: supabase-js still sends a key header; local Design may accept dummy anon key or ignore `apikey` (compat must not invent security policy — validate Bearer JWT via Imp-02).

---

## 5. Data & secrets

| Item | Local handling |
|---|---|
| `DATABASE_URL` | Compose internal / `.env` |
| `JWT_SECRET` | Local `.env` — **must** match token issue/verify |
| Refresh tokens | Table `refresh_tokens` in Postgres |
| Profiles / domain tables | Migrations 001–010 |
| Seed data | **Missing** official pack — blocker |

---

## 6. Explicitly deferred runtime pieces

| Piece | Why deferred |
|---|---|
| MinIO | No storage contract |
| Mailhog | No mail contract |
| Redis | Not required by sealed Imp-09/10 architecture |
| Supabase Realtime container | Would be alternate bridge strategy — open DR |
| Multi-node API | ADR-001 single-process baseline |

---

## 7. Architecture principle

**One write path:** FE → compat → existing services → Postgres TX.  
**One auth path:** Imp-02.  
**One realtime path (Unified):** Imp-09 SSE (FE adaptation open).  
**No second business stack.**
