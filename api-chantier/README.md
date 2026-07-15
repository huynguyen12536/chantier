# api-chantier

Backend Express.js **modular** + PostgreSQL cho migration khỏi Supabase.

Nguồn kiến trúc: `plan/plan/00_README_EXECUTION.md` (Phase 4) · SoT: `migration-analysis/`.

## Stack

| Layer | Tech |
|-------|------|
| HTTP | Express 5 |
| DB | PostgreSQL via `pg` pool |
| Auth (sẽ hoàn thiện Phase 5) | JWT + bcryptjs |
| Validation | Zod |

## Cấu trúc module

```
src/
  app.js                 # Express app (middleware + mount modules)
  server.js              # HTTP listen + DB ping
  config/                # env
  shared/
    db/                  # pool
    errors/              # AppError
    middleware/          # auth stub, errorHandler, notFound
    utils/               # asyncHandler
  modules/
    health/              # GET /health
    auth/                # Imp-02 JWT auth
    users/               # Imp-03/11 users Administration
    chantiers/           # Imp-04 sites
    affectations/        # Imp-05 assignments
    zones/               # Imp-05 team zones
    timesheet/           # Imp-06 periodes + declarations
    validation/          # Imp-07 approve/reject/cancel
    export/              # Imp-08 payroll export
    realtime/            # Imp-09 SSE /events
    compat/              # Imp-12 Wave A — LEGACY FE adapters only (not primary APIs)
```

Mỗi domain module: `routes.js` · `controller.js` · `service.js` · `repository.js`.

## API index

### Primary Unified REST (preferred)

| Prefix | Owner |
|--------|--------|
| `/health` | Imp-01 |
| `/api/auth` | Imp-02 |
| `/api/users` | Imp-03 / Imp-11 |
| `/api/chantiers` | Imp-04 |
| `/api/affectations` | Imp-05 |
| `/api/zones` | Imp-05 |
| `/api/timesheet` | Imp-06 |
| `/api/validation` | Imp-07 |
| `/api/export` | Imp-08 |
| `/events` | Imp-09 |

### Legacy compatibility adapters (Imp-12 Wave A — frozen CVL FE only)

> **Not primary APIs.** Transport aliases only. Business lives in Imp-03 / Imp-04 / Imp-11 services. Wave B table adapters are **blocked** until authorized.

| Compat path | Delegates to |
|-------------|--------------|
| `POST /functions/create-user` · `POST /functions/v1/create-user` | `users.createUser` |
| `POST /functions/delete-user` · `POST /functions/v1/delete-user` | `users.deleteUser` |
| `POST /rpc/delete_chantier_cascade` · `POST /rest/v1/rpc/delete_chantier_cascade` | `chantiers.deleteChantierCascade` |
| `GET/PATCH /tables/profiles` | `users` list/get/`updateUser` |

All routes (including compat) receive `x-correlation-id` via global middleware.

## Setup với Docker (khuyến nghị)

```bash
cd api-chantier
cp .env.example .env
docker compose up -d --build
```

| Service | URL / port |
|---------|------------|
| API | http://localhost:3000 (đổi `API_PORT` trong `.env` nếu port bận — đang chạy thử: **3001**) |
| Health | http://localhost:${API_PORT}/health |
| Postgres | localhost:5432 (`chantier` / `chantier` / db `chantier`) |

Lệnh hữu ích:

```bash
npm run docker:up      # build + start
npm run docker:logs    # tail logs
npm run docker:ps      # status
npm run docker:down    # stop
```

## Setup local (không Docker API)

Vẫn cần Postgres (có thể chỉ chạy `docker compose up -d db`):

```bash
cp .env.example .env
npm install
npm run dev
```

## Trạng thái hiện tại

Imp-02 → Imp-11 domain APIs implemented. Imp-12 Wave A compatibility layer **COMPLETE** (approved).  
Primary clients should use `/api/*`. Compat `/functions/*`, `/rpc/*`, `/tables/*` are legacy FE adapters only.
