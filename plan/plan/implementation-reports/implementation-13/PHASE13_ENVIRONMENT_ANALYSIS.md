# PHASE13_ENVIRONMENT_ANALYSIS.md

**Date:** 2026-07-15  
**Mode:** Investigation — FE + API env mapping for local cutover  
**FE sources:** `.env.example`, `app.config.js`, `services/supabase.ts`  
**API sources:** `api-chantier/docker-compose.yml`, typical `.env`

---

## 1. Frontend environment variables (complete list)

| Variable | Where set | Current value / role | Cutover fate |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.example`, overridden by `app.config.js` `extra` | Cloud Supabase project URL | **BECOMES local API base** (e.g. `http://localhost:3000`) — name may stay for supabase-js or rename in FE thaw |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same | JWT-looking anon key (committed in `app.config.js`) | **LIKELY becomes dummy / unused** if Unified ignores `apikey` and trusts Bearer; or local static “anon” string for client init only |
| `EXPO_FORCE_WEBCONTAINER_ENV` | `.env.example`, forced in `app.config.js` | Bolt / WebContainer tunnel helper | **STAYS** for Bolt DX; irrelevant for pure local LAN |
| `Constants.expoConfig.extra.*` | `app.config.js` | Injects URL + anon into runtime | **MUST CHANGE** for local — currently **hardcodes cloud** |

### Script-only (not app runtime)

| Variable | Where | Fate |
|---|---|---|
| `VITE_SUPABASE_URL` | `scripts/create-test-users.ts` | Align with local API or drop script |
| `VITE_SUPABASE_ANON_KEY` | same | same |

---

## 2. Hardcode problem (critical)

`app.config.js` commits:

```text
EXPO_PUBLIC_SUPABASE_URL = https://afgveikzneaablcuzwdb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJ... (anon JWT)
```

Even with a local `.env`, Expo `extra` can win depending on load order. **Local cutover requires changing this config** (or process.env precedence Design) — conflicts with historical FE freeze → **open DR**.

---

## 3. Backend / Compose environment

| Variable | Role | Cutover fate |
|---|---|---|
| `POSTGRES_USER` / `PASSWORD` / `DB` | DB bootstrap | **STAY** |
| `POSTGRES_PORT` | Host map | **STAY** |
| `DATABASE_URL` | API → Postgres | **STAY** (Compose-internal) |
| `JWT_SECRET` | Imp-02 tokens | **STAY** — local secret; rotate per env |
| `JWT_EXPIRES_IN` | Access TTL | **STAY** |
| `CORS_ORIGIN` | Browser FE | **BECOMES** specific origins (`http://localhost:8081`, Expo web origin, LAN) — `*` OK for early local |
| `API_PORT` | Host 3000 | **STAY** |
| `NODE_ENV` | runtime | **STAY** |
| SSE knobs (`sseHeartbeatMs`, etc.) | Imp-09 | **STAY** if set |

### Not required locally (CVL)

| Variable class | Why |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Deno only; Unified uses Imp-03/11 |
| `SUPABASE_ANON_KEY` (server) | Same |
| Redis URL | Not in architecture |
| S3 / MinIO keys | No storage |
| SMTP | No mail |

---

## 4. Mapping: disappears / becomes / stays

| Category | Variables |
|---|---|
| **Disappear (server-side Supabase)** | Service role, remote Supabase URL for Edge Deno, hosted Realtime/Kong secrets |
| **Become Backend URLs** | `EXPO_PUBLIC_SUPABASE_URL` → local API origin (compat + `/api` same host) |
| **Become inert / placeholder** | Anon key (unless Design reuses header) |
| **Stay** | Postgres, JWT, CORS, API port, Expo DX flags |

---

## 5. Dual URL concern

supabase-js uses **one** base URL for:

- `/auth/v1/*`  
- `/rest/v1/*`  
- `/functions/v1/*`  
- Realtime websocket (different subdomain pattern on hosted Supabase)

On Unified, HTTP compat shares one host — **good for REST/auth/functions**.  
Realtime websocket to same host is **not** Imp-09 SSE — still a gap.

Unified also exposes `/api/*` — FE does not use those paths today; cutover need not expose them to FE if compat is complete.

---

## 6. STOP

Env cutover is conceptually simple (point FE at local API) but **blocked** by hardcoded cloud config and protocol gaps beyond URL swapping.
