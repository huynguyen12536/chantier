# Task: P1_T03 — Super Admin brief vs single-tenant decision

## Task Metadata
- Task ID: P1_T03_super_admin_scope_decision
- Phase: phase_01_architecture_validation
- Status: Done
- Priority: High
- **Task Type:** Documentation
- Primary Agent: Product Manager / Software Architect
- Required Review Agents: Product Manager (human)
- Estimated Effort: 0.25 day
- Dependencies: P1_T01, P1_T02

## Problem and Outcome

**Problem:** Brief có thể kỳ vọng 2-DB Super Admin; repo là single-tenant. Cần decision_log rõ để tránh scope creep Phase 3+.

**Expected outcome:** Decision xác nhận single-tenant = hiện trạng & scope migrate mặc định; Flow H = greenfield out-of-scope.

## In Scope
- Đối chiếu brief bảng trong `00-IMPORTANT-FINDINGS.md` với code (roles, không companies)
- Ghi/confirm row trong `tracking/decision_log.md`
- Ghi matrix §8

## Out of Scope
- Thiết kế multi-company
- Schema tenancy DDL (Phase 8)
- Implement Flow H

## Inputs (SoT + plan)
- `migration-analysis/00-IMPORTANT-FINDINGS.md`
- `migration-analysis/frontend-overview.md` §10
- `plan/plan/01_CURRENT_SYSTEM_STATE.md` §1
- Existing decision_log row 2026-07-14 Scope Super Admin

## Implementation Root
- [x] `plan/plan/tracking/decision_log.md`
- [x] phase confirmation matrix

## Acceptance Criteria
- [x] Decision: Super Admin / multi-company **out of scope** trừ quyết định mở sau
- [x] Hiện trạng = single-tenant 4 roles
- [x] Phân biệt `auth.users.is_super_admin` (cột seed Supabase) ≠ app Super Admin
- [x] Status board updated
- [x] Cite SoT

## Evidence
- No `companies` / `company_id` / Super Admin screens
- Roles: `ouvrier | chef_equipe | administratif | admin`
- `is_super_admin` chỉ trong INSERT `auth.users` seed migrations

## Decision
Confirm and extend prior decision_log entry — see `tracking/decision_log.md` dated 2026-07-14 (Phase 1 confirm).
