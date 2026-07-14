# Chantier — Current System State

Status: Reference inventory (**Legacy Analysis** = `migration-analysis/`)  
Last Updated: 2026-07-14 (Consolidation addendum)  
Owner: Product Manager + Software Architect

> File này mô tả **hiện trạng legacy** (chủ yếu System đã RE trong workspace).  
> **Mục tiêu dự án:** Consolidation + Replatforming — xem `00_README_EXECUTION.md`.  
> **SoT thiết kế hợp nhất:** Merge Specification (Phase 3) — chưa có.  
> **Chi tiết kỹ thuật Legacy:** `migration-analysis/SUMMARY.md` và README (tags Legacy / Merge / Unified).

---

## 1. Product Summary

**Chantier** là ứng dụng **BTP timesheet** (khai báo / validation giờ công):

| Role (`profiles.role`) | Trách nhiệm chính |
|---|---|
| `ouvrier` | Khai báo `periodes_travail` (GPS, panier, déplacement) |
| `chef_equipe` | Zones équipe, validate / reject giờ |
| `administratif` | Export paie; (Edge) được tạo user |
| `admin` | Users, chantiers, affectations, full admin |

**Không** có multi-company / Super Admin trong code hiện tại (`00-IMPORTANT-FINDINGS.md`). Brief 2-DB là kiến trúc đích tiềm năng, không phải hiện trạng.

---

## 2. Repository Layout (workspace này)

```
chantier/
├── chantier1/.../Chantier-web-app-main/   # Legacy FE A (candidate) + supabase + Edge
├── api-chantier/                          # Unified Backend scaffold (not Done)
├── migration-analysis/                    # Legacy Analysis (+ merge/ / unified/ later)
└── plan/plan/                             # Agentic Flow Consolidation
```

| Root | Vai trò |
|---|---|
| FE legacy (workspace) | Candidate **Frontend A** |
| BE scaffold | Target Unified Backend (empty of business logic) |
| Legacy Analysis | `migration-analysis/` |
| Design SoT (sau Phase 3) | Merge Specification |
| Governance | `plan/plan/` |

---

## 3. Legacy stack (Supabase)

| Layer | Technology |
|---|---|
| Client | Expo / React Native, `expo-router` |
| Data | Singleton `@supabase/supabase-js` → PostgREST |
| Auth | Supabase Auth email/password; role từ bảng `profiles` |
| Admin users | Edge Functions `create-user`, `delete-user` (service role) |
| Realtime | `postgres_changes` trên `periodes_travail`, `declarations_heures` |
| Storage | **Không dùng** |
| RPC live | `delete_chantier_cascade` |
| Logic DB | Triggers sync periods ↔ declarations + auto-approve |

Runtime project: `afgveikzneaablcuzwdb` (chốt Phase 1). CLI / optional local notes: `hzppsttpzzeuslnpcdkv` — **không** dual-client FE. Evidence: `phases/phase_01_architecture_validation/CONFIRMATION_MATRIX.md`.

Chi tiết gọi Supabase: `migration-analysis/frontend-supabase-usage.md`.

---

## 4. Data model (tóm tắt)

Tables: `profiles`, `chantiers`, `affectations_chantiers`, `periodes_travail`, `declarations_heures`, `zones_equipe`, `zones_chantiers`, `zones_ouvriers`.  
View: `synthese_heures_journalieres`.

Triggers (3): sync declarations ← periods; sync periods ← declaration; auto-approve matching shift.  
Functions/helpers: xem `migration-analysis/functions/`.

Chi tiết: `database-schema.md`, `entity-relationship.md`, `triggers/`, `rls-analysis.md`.

---

## 5. Core flows

1. Admin tạo user (Edge) → profile  
2. Admin tạo chantier + affectations (+ zones)  
3. Ouvrier insert periods → trigger → declarations  
4. (Optional) auto-approve ca lặp  
5. Chef validate / reject / cancel  
6. Administratif export (FE)

Chi tiết: `business-flows.md`, `auth-flow.md`, `diagrams/`.

---

## 6. Target stack (migration)

| Layer | Technology |
|---|---|
| API | Express.js **modular** (`api-chantier/src/modules/...`) |
| DB | PostgreSQL standalone (Docker Compose `db`) |
| Auth | JWT backend (Phase 5) — thay Supabase Auth |
| AuthZ | Middleware/policies — thay RLS helpers |
| Runtime | Docker Compose (`api` + `db`) |

Scaffold đã có (`/health` live; routes nghiệp vụ `501`). ADR + nghiệp vụ chưa Done — xem Master Plan Phase 4/9.

---

## 7. Migration readiness highlights

**Phải port sang Backend:** sync triggers, cascade delete, user Edge rules, validate/cancel, auto-approve (audit `validated_by`), export aggregation, chef scope authZ.

**Giữ DB:** FK, UNIQUE, CHECK, indexes; (tuỳ chọn) calc functions / view.

**Bỏ/đơn giản:** dual validate FE+trigger; RPC week auto-approve nếu product không dùng; open SELECT profiles/chantiers khi multi-tenant.

Nguồn: `migration-readiness.md`, `SUMMARY.md` §4–9.

---

## 8. Using this doc

- Agent đọc file này + **SoT path cụ thể** trước khi Design/Implement.  
- Phases / checklist: `00_README_EXECUTION.md`.  
- `01` **không** thay thế dump production — Phase 2 vẫn bắt buộc.
