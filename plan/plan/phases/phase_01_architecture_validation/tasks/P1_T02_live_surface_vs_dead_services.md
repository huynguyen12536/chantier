# Task: P1_T02 — Live screens vs dead services + Edge/realtime

## Task Metadata
- Task ID: P1_T02_live_surface_vs_dead_services
- Phase: phase_01_architecture_validation
- Status: Done
- Priority: High
- **Task Type:** Analysis
- Primary Agent: Software Architect
- Supporting Agents: Technical Writer
- Required Review Agents: Software Architect (human)
- Estimated Effort: 0.5 day
- Dependencies: P1_T01

## Problem and Outcome

**Problem:** Cần danh sách surface FE thực sự live (screens, Edge, realtime) vs dead services để Phase 4 map API không dựa contract sai.

**Expected outcome:** Inventory live surface + dead code confirmation, khớp/tăng cường `frontend-supabase-usage.md`.

## In Scope
- Grep imports `services/supabase` vs `AuthService`/`PeriodsService`/`WorksitesService`
- Xác nhận callers Edge `create-user` / `delete-user` / `seed-test-users`
- Xác nhận realtime channels trên timesheet / validation / chef-dashboard
- Ghi vào CONFIRMATION_MATRIX §4–7

## Out of Scope
- Refactor xóa dead services
- Implement backend endpoints
- Thay realtime
- Super Admin

## Inputs (SoT + plan)
- `migration-analysis/frontend-supabase-usage.md`
- `migration-analysis/frontend-overview.md`
- `plan/plan/00_README_EXECUTION.md` Phase 1

## Implementation Root
- [x] FE read-only
- [x] `plan/plan/` documentation
- [x] `migration-analysis/` documentation nếu delta

## Acceptance Criteria
- [x] Danh sách screens/utils live gọi Supabase
- [x] Dead: AuthService, PeriodsService, WorksitesService (không UI import)
- [x] Edge live: create-user, delete-user; seed không gọi từ UI
- [x] Realtime: 3 screens liệt kê
- [x] Status board updated
- [x] Claims cite SoT/source

## Evidence summary

Live imports confirmed for AuthContext, declare-day*, tabs (ouvrier/timesheet/chef/validation/export/management/admin-*/team/worksite/user-payroll), utils (team, worksiteCode, ouvrierDeclaration), ChooseDayCalendar.

Edge:
- `management.tsx`, `admin-users.tsx` → create-user + delete-user
- No UI call to seed-test-users

Realtime:
- `timesheet.tsx`, `validation.tsx`, `chef-dashboard.tsx`

Dead services: no screen imports classes; only re-exported from `services/index.ts`.

## Files changed
- `CONFIRMATION_MATRIX.md` §4–7
- Light SoT note in `frontend-overview.md` if needed
