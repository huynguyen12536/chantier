# PHASE14_RUNTIME_VALIDATION.md

**Date:** 2026-07-15  
**Method:** curl against running Docker stack + FE HTTP probe

## Flow checklist

| Step | Method | Result | Evidence |
|---|---|---|---|
| Login | `POST /auth/v1/token` | **PASS** | HTTP 200 + tokens |
| CRUD chantier | POST/GET/PATCH `/rest/v1/chantiers` | **PASS** | 201/200 + hour alias map |
| Assignements | `POST /rest/v1/affectations_chantiers` as chef | **PASS** | HTTP 201 |
| Timesheet period | `POST /rest/v1/periodes_travail` as ouvrier | **PASS** | HTTP 201; declaration auto `soumise` |
| Validation | `PATCH .../declarations_heures/:id` → Imp-07 | **PASS** | HTTP 200 `statut=validee` |
| Export | `GET /api/export/stats` | **PASS** | HTTP 200 counters |
| Edge create/delete user | POST `/functions/v1/*` | **PASS** | 201 then 200 |
| RPC cascade | POST `/rest/v1/rpc/delete_chantier_cascade` | **PASS** | 200 then GET 404 |
| SSE notify transport | `GET /events` | **PASS** | `event: connected` streamed |
| Logout | `POST /auth/v1/logout` | **PASS** | 200; refresh reuse 401 |
| Login again | password grant | **PASS** | 200 |
| FE serves | `GET http://127.0.0.1:16035/` | **PASS** | HTTP 200 |

## Performance (basic)

| Metric | Observed |
|---|---|
| `/health` latency | ~9–21 ms |
| Auth login | ~68 ms |
| Typical GETs | ~4–30 ms |
| Compose up (warm images) | ~12.1 s to healthy API |
| Compose down | ~2.3 s |
| Container memory | db ~44 MiB · api ~36 MiB · web ~14 MiB |

No load benchmarking performed.

## Verdict

**PASS** for seeded local product functional loop.
