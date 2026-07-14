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
    auth/                # login / me (stub)
    users/               # CRUD users (stub)
    chantiers/           # sites (stub)
    affectations/        # assignments (stub)
    zones/               # team zones (stub)
    timesheet/           # periodes + declarations (stub)
    validation/          # approve/reject/cancel (stub)
    export/              # payroll export (stub)
```

Mỗi module: `routes.js` · `controller.js` · `service.js` · `repository.js` (thêm khi implement).

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

Scaffold khởi tạo — routes trả `501 Not Implemented` trừ `/health`.  
Implement nghiệp vụ theo Master Plan Phase 5+.
