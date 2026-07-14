# Task: EX_T01_port_sync_declarations — Port sync declarations (EXAMPLE ONLY)

> **Không phải task thật.** Copy cấu trúc khi tạo task Phase 7/9 thật.

## Task Metadata
- Task ID: EX_T01_port_sync_declarations
- Phase: _example
- Status: Todo
- Priority: Low
- **Task Type:** Design
- Primary Agent: Backend Architect
- Supporting Agents: Database Optimizer
- Required Review Agents: Senior Developer, Security Engineer
- Dependencies: None

## Problem and Outcome

**Problem:** Logic tạo/cập nhật `declarations_heures` đang nằm trong trigger `trigger_sync_declarations` — cần port sang Backend khi tắt Supabase triggers.

**Expected outcome:** Spec service `TimesheetService.syncDeclarationsFromPeriods` parity với SoT; sẵn sàng Implementation.

## In Scope
- Viết sequence + pseudo từ SoT function
- Map soft-cancel `annulee` và upsert từ `synthese_heures_journalieres`
- Ghi decision Keep/Port cho liên quan `nb_deplacements`

## Out of Scope
- Implement code production
- Tắt trigger trên production
- Super Admin / multi-company

## Inputs (SoT)
- `migration-analysis/triggers/trigger_sync_declarations.md`
- `migration-analysis/functions/sync_declarations_from_periods.md`
- `migration-analysis/migration-readiness.md`
- `plan/plan/00_README_EXECUTION.md` Phase 7

## Implementation Root
- [x] `plan/plan/` (example / design doc only)

## Acceptance Criteria
- [ ] Spec covers insert/update/delete period paths
- [ ] Soft-cancel rules documented
- [ ] Risks R-01 / R-05 addressed in notes
- [ ] Ready for a follow-up Implementation task in `api-chantier/`

## Definition of Done
- Example only — do not mark real board Done for this ID
