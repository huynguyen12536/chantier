# PHASE14_API_VALIDATION.md

**Date:** 2026-07-15  
**Base URL:** `http://127.0.0.1:3001`  
**Auth:** seeded `admin@local.test` / `Password123!` via `/auth/v1/token`  
**Tool:** `curl.exe` + JSON body files (PowerShell)

## Auth

| Call | Status | Time | Evidence |
|---|---|---|---|
| `POST /auth/v1/token?grant_type=password` | **200** | ~0.068s | Returns `access_token`, `refresh_token`, `user.email=admin@local.test` |
| `GET /auth/v1/user` | **200** | ~0.006s | `{"user":{...,"role":"admin"...}}` |
| `GET /api/auth/me` | **200** | ~0.004s | Profile OK |
| `POST /auth/v1/token?grant_type=refresh_token` | **200** | — | New access/refresh issued |
| `POST /auth/v1/logout` | **200** | — | `{"ok":true}` |
| Reuse revoked refresh | **401** | — | `{"error":"Invalid refresh token"}` |
| Relogin after logout | **200** | — | Confirmed |
| Chef login `chef@local.test` | **200** | — | Confirmed |

## Health

| Call | Status | Time | Body snippet |
|---|---|---|---|
| `GET /health` | **200** | ~0.009–0.021s | `"database":"up"`, migrations 001…010 applied, pending `[]` |

## Native business APIs

| Call | Status | Notes |
|---|---|---|
| `GET /api/users` | **200** | Large list (~175KB) |
| `GET /api/chantiers` | **200** | Wrapped `{chantiers:[...]}` |
| `GET /api/affectations` | **200** | OK |
| `GET /api/zones` | **200** | OK |
| `GET /api/timesheet/periods` | **200** | Large payload |
| `GET /api/timesheet/declarations` | **200** | Large payload |
| `GET /api/validation/queue` | **200** | Admin has pending; chef scoped queue may be empty |
| `GET /api/export/stats` | **200** | e.g. `total_declarations`, `validees`, `en_attente`, `total_heures` |
| `POST /api/validation/declarations/:id/approve` (already validee) | **409** | `Invalid transition` — expected after compat PATCH approve |

## Compatibility `/rest/v1` + `/tables`

| Call | Status | Notes |
|---|---|---|
| `GET /rest/v1/profiles` | **200** | Array |
| `GET /tables/profiles` | **200** | Dual mount |
| `GET /rest/v1/chantiers` | **200** | Includes FE aliases `heure_debut`/`heure_fin` |
| `POST /rest/v1/chantiers` (hour aliases) | **201** | Mapped matin fields |
| `GET /rest/v1/chantiers?id=` | **200** | Single row |
| `PATCH /rest/v1/chantiers/:id` | **200** | Nom updated |
| `POST /rest/v1/rpc/delete_chantier_cascade` | **200** | body `null` |
| `GET /api/chantiers/:id` after cascade | **404** | Cascade confirmed |
| `GET /rest/v1/affectations_chantiers` | **200** | OK |
| `POST /rest/v1/affectations_chantiers` (chef) | **201** | assignUser path |
| `GET /rest/v1/zones_equipe` | **200** | OK |
| `GET /rest/v1/periodes_travail` | **200** | OK |
| `POST /rest/v1/periodes_travail` (ouvrier) | **201** | Created period 2026-07-16 |
| `GET /rest/v1/declarations_heures` | **200** | OK |
| `PATCH /rest/v1/declarations_heures/:id` `{statut:validee}` | **200** | Delegates Imp-07 → `statut=validee` |

## Edge

| Call | Status | Notes |
|---|---|---|
| `GET /functions/v1/create-user` | **404** | Method not registered (POST-only) — expected |
| `POST /functions/v1/create-user` | **201** | `success:true` + user |
| `POST /functions/v1/delete-user` | **200** | `{"success":true}` |

## SSE

| Call | Result |
|---|---|
| `GET /events?access_token=…` | **200** `text/event-stream`; first event `event: connected` with `userId`/`role`; curl `--max-time 2` times out after stream (expected for long-lived SSE) |

## Verdict (API)

**PASS** for authentication, core CRUD, validation, export, compat, Edge POST, RPC, SSE connected handshake.
