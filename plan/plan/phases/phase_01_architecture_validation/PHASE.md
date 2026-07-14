# Phase 01 — Current Architecture Validation

> Align with **Phase 1** in `00_README_EXECUTION.md` (Goal / Inputs / Outputs / Acceptance Criteria).

## Objective

Xác nhận Source of Truth khớp runtime thực tế: env, project refs, FE entrypoints, Edge/realtime surface — trước khi Phase 2 dump production.

## SoT Inputs

- `migration-analysis/frontend-overview.md`
- `migration-analysis/frontend-supabase-usage.md`
- `migration-analysis/00-IMPORTANT-FINDINGS.md`
- `migration-analysis/auth-flow.md` (Edge surface)
- Master Plan section: Phase 1
- FE: `app.config.js`, `env`, `.env.example`, `eas.json`, `services/supabase.ts`, `supabase/.temp/linked-project.json`

## Timebox

1 session Validation / Documentation (không sửa business logic)

## Tasks

| Task | Title | Type | Primary Agent | Priority | Dependencies |
|---|---|---|---|---|---|
| [P1_T01](tasks/P1_T01_validate_supabase_runtime.md) | Validate FE client singleton + env | Validation | Software Architect | High | None |
| [P1_T02](tasks/P1_T02_live_surface_vs_dead_services.md) | Live screens vs dead services + Edge/realtime | Analysis | Software Architect | High | P1_T01 |
| [P1_T03](tasks/P1_T03_super_admin_scope_decision.md) | Super Admin brief vs single-tenant | Documentation | Product Manager / Software Architect | High | P1_T01, P1_T02 |

## Entry Criteria

- [x] Phase 0 Exit Criteria met (SoT `migration-analysis/` tồn tại)
- [x] Đọc Master Plan Phase 1 + SoT Inputs trước khi execute

## Exit Criteria

- [x] All tasks Done (evidence trong task files + CONFIRMATION_MATRIX.md)
- [x] Architecture Scope Validation → **Confirmed** (`ARCHITECTURE_SCOPE_VALIDATION.md`)
- [x] Phase Acceptance Criteria in Master Plan satisfied
- [x] Gates in `04_GLOBAL_GATES.md` (G1/G2 phase docs) addressed
- [x] Risks updated in `05_RISK_REGISTER.md` (R-06 closed mitigation; R-08/R-13 updated)
- [x] Decision Log: Architecture Scope Confirmed

## Risks

- Nhầm env → design sai (Master Plan Phase 1)
- Hardcode anon key (R-08)
- File `env` chứa 2 project + JWT claim `service_role` → lệch local/prod nếu copy nhầm (R-13)

## Notes

- Deliverable chính: [`CONFIRMATION_MATRIX.md`](CONFIRMATION_MATRIX.md)
- Không implement FE/BE; không dump DB (Phase 2)
- Không mở Super Admin scope trừ decision_log (đã xác nhận out of scope)
- Cập nhật `tracking/status_board.md` sau mỗi status change
