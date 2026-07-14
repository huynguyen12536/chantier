# Task: P1_T01 — Validate FE client singleton + env

## Task Metadata
- Task ID: P1_T01_validate_supabase_runtime
- Phase: phase_01_architecture_validation
- Status: Done
- Priority: High
- **Task Type:** Validation
- Primary Agent: Software Architect
- Supporting Agents: Technical Writer
- Required Review Agents: Software Architect (human)
- Estimated Effort: 0.5 day
- Dependencies: None

## Problem and Outcome

**Problem:** SoT mô tả runtime `afgveikz…` vs CLI `hzppst…`; cần xác nhận bằng env/config/source, tránh thiết kế dual-DB sai.

**Expected outcome:** Confirmation matrix chốt URL/key runtime; không dual-client; ghi rõ rủi ro file `env`.

## In Scope
- Đọc `app.config.js`, `.env.example`, `eas.json`, file `env`, `services/supabase.ts`, `linked-project.json`
- Grep `createClient` / project refs trong FE
- Ghi evidence vào `CONFIRMATION_MATRIX.md`
- Cập nhật SoT nếu phát hiện lệch nhỏ (file `env`)

## Out of Scope
- Sửa code FE/BE
- Rotate secrets
- Dump production DB (Phase 2)
- Super Admin implementation
- Commit git

## Inputs (SoT + plan)
- `plan/plan/00_README_EXECUTION.md` Phase 1
- `plan/plan/01_CURRENT_SYSTEM_STATE.md`
- `migration-analysis/00-IMPORTANT-FINDINGS.md`
- `migration-analysis/frontend-overview.md`
- `tracking/status_board.md`

## Implementation Root
- [ ] `api-chantier/`
- [x] `chantier1/Chantier-web-app-main/Chantier-web-app-main/` (read-only)
- [x] `migration-analysis/` (Documentation updates allowed)
- [x] `plan/plan/` (governance)

## Acceptance Criteria
- [x] Runtime URL/key chốt: `afgveikzneaablcuzwdb` + anon từ `app.config.js`/`eas.json`
- [x] Xác nhận không dual-client FE
- [x] Document `hzppst…` = CLI + optional local notes (`env`), không phải Super Admin DB
- [x] Status board updated
- [x] No unresolved Critical/High **within task scope** (secret hygiene escalated to R-08/R-13, không block Phase 1 AC)
- [x] Legacy claims cite SoT / source paths

## Definition of Done
- All acceptance criteria checked
- Evidence: `../CONFIRMATION_MATRIX.md` §1–3
- Required reviews: chờ human review phase

## Evidence summary

| Check | Result |
|---|---|
| Singleton | `services/supabase.ts` — 1 `createClient` |
| Resolved default | afgveikz via `app.config.js` extra |
| No `.env` loaded in workspace | Only `.env.example`; informal file `env` exists |
| `env` anomaly | Two blocks (afgveikz then hzppst); JWT claims `service_role` under ANON_KEY name |

## Risks
- Copy `env` → `.env` có thể trỏ sai project / bypass RLS (R-13)

## Files changed
- Created phase confirmation matrix
- Updated `migration-analysis/00-IMPORTANT-FINDINGS.md` (§2 env note)
