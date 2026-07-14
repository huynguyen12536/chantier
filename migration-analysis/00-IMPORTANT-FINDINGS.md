# Phát hiện quan trọng trước khi đọc các tài liệu khác

> **Tag: Legacy Analysis** (System trong workspace — candidate A).  
> **Không** phải Merge Analysis / Unified Analysis.  
> Project direction (2026-07-14): Consolidation + Replatforming — xem `plan/plan/00_README_EXECUTION.md`.

**Nguồn:** Frontend + `supabase/migrations/` + Edge Functions trong repo `chantier1/Chantier-web-app-main/`.  
**Ngày phân tích:** 2026-07-14.

---

## 1. Kiến trúc mục tiêu (theo brief) vs thực tế trong repo

| Brief (mong đợi) | Thực tế reverse-engineer |
|------------------|--------------------------|
| Frontend dùng chung + **2 Supabase project** độc lập | Frontend Expo **một singleton client** |
| Database A = Super Admin (quản lý công ty, tạo Admin) | **Không có** bảng `companies`, `company_id`, app Super Admin, hay client thứ 2 trong code runtime |
| Database B = Company (Site / Supervisor / Employee) | **Một** schema BTP timesheet single-tenant: roles `admin` / `administratif` / `chef_equipe` / `ouvrier` |

**Kết luận:** Repo hiện tại mô tả **một company database** (quản lý giờ công BTP). Phân tầng Super Admin ↔ nhiều company DB **chưa có trong source** — có thể là kiến trúc đích cho migrate/backend mới, không phải hiện trạng code.

---

## 2. Hai Project ID Supabase tìm thấy

| Ref / Host | Vai trò trong repo |
|------------|-------------------|
| `afgveikzneaablcuzwdb` → `https://afgveikzneaablcuzwdb.supabase.co` | **Runtime** app (`app.config.js`, `.env.example`, `eas.json`) |
| `hzppsttpzzeuslnpcdkv` (tên CLI: **CHANTIER**) | `supabase/.temp/linked-project.json` (CLI link) + block thứ 2 trong file ghi chú `env` (không phải `.env`) — **không** có `createClient` thứ 2 |

**Phase 1 validation (2026-07-14):** Không dual-client FE. Runtime committed = `afgveikz…` + anon key. Workspace **không** có `.env` active; file tên `env` chứa **hai** block (afgveikz rồi hzppst) và JWT gán tên `EXPO_PUBLIC_SUPABASE_ANON_KEY` nhưng claim `role=service_role` — nguy hiểm nếu copy thủ công thành `.env` (xem `plan/plan/phases/phase_01_architecture_validation/CONFIRMATION_MATRIX.md`, Risk R-08/R-13).

**Architecture Scope (2026-07-14):** **Confirmed** — đây là **Company Portal** BTP timesheet (single-tenant), **không** phải Super Admin Portal, **không** có evidence repo ứng dụng thứ hai bắt buộc (`DFM-EUROPE/Chantier-web-app` là remote duy nhất trong CI). Chi tiết: `plan/plan/phases/phase_01_architecture_validation/ARCHITECTURE_SCOPE_VALIDATION.md`.

Đây gần như **dev/EAS default vs CLI/local**, không phải Dual-DB SuperAdmin/Company. Project ref **production VM** nằm trong GitHub secrets — phải chốt trước dump (**Phase 2**).

---

## 3. Ánh xạ thuật ngữ brief → domain hiện tại

| Brief | Trong code / DB |
|-------|-----------------|
| Company | Toàn bộ project = 1 doanh nghiệp (không có entity Company) |
| Admin công ty | `profiles.role = 'admin'` (+ `administratif` cho export / một số quyền) |
| Supervisor | `chef_equipe` |
| Employee | `ouvrier` |
| Site | `chantiers` |
| Gán Supervisor/Employee vào Site | `affectations_chantiers` (+ zones: `zones_equipe` / `zones_chantiers` / `zones_ouvriers`) |

---

## 4. Nguồn schema cho bước 5–8

**Nguồn schema live:** dump CLI project `hzppsttpzzeuslnpcdkv` (Phase 2, 2026-07-14) — xem `production-vs-repository-diff.md`. Repo migrations **không** khớp 1-1 với live (`schema_migrations` chỉ 5 rows; nhiều function repo chưa deploy).
