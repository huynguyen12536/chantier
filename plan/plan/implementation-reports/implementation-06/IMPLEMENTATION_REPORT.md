# IMPLEMENTATION_REPORT — Imp-06 Timesheet

| Field | Value |
|---|---|
| Module Name | Imp-06 Timesheet (Time Recording) |
| Business Capability | Period commands, declaration projection, CADRE hours, Soft Annulee, auto-approve audit |
| Wave | 2 |
| Status | **PASS** |
| Date | 2026-07-14 |

## Source of Truth used
1. Decision Log — DR-IMP06-001 Soft Annulee · DR-IMP06-002 CADRE · DR-IMP06-003 P+Fsplit  
2. Merge Spec — `triggers_mapping.md`, `functions_rpc_mapping.md`, `CONFLICT_MATRIX.md`, `SHARED_BUSINESS_RULES.md`  
3. Unified Domain — `04_STATE_MACHINES.md`, `05_RULE_OWNERSHIP.md`  
4. CVL — SUMMARY rules 5–15; FE contract frozen (no FE edits)  
5. Imp-06 planning matrices — BUSINESS_RULE / LEGACY_MAPPING / TRACEABILITY  

## Business Rules implemented
| Rule | Implementation |
|---|---|
| Soft Annulee (DR-001) | `DeclarationSyncService` → `softAnnuleeDeclaration` (no DELETE) |
| CADRE + 7h fallback (DR-002) | `TimesheetCalculationService.splitHours` / `synthesizeDay` |
| Omit `nb_deplacements` on sync (DR-003 P+) | `upsertDeclarationSoumise` does not SET that column |
| Auto-approve audit (DR-003 F) | `AutoApprovalPolicyService` sets `validated_by` + `validated_at` (system actor) |
| Period → declaration TX | `TimesheetService` + `withTransaction` |
| Decision → periods | `PeriodPropagationService` |
| UNIQUE day declaration | DB UNIQUE + upsert |

## Artifacts

| Kind | Items |
|---|---|
| API | `GET/POST/PATCH/DELETE /api/timesheet/periods`, `GET /api/timesheet/declarations`, `POST …/decide` |
| Controller | `timesheet/controller.js` |
| Services | declarationSync, periodPropagation, autoApproval, timesheetService |
| Domain | timeUtility, calculation |
| Repository | `timesheet/repository.js` |
| DTO / Validation | `dto.js`, `validation.js` |
| DB Migration | `migrations/005_timesheet.sql` |
| Tests | `test/timesheet.test.js` |

## Review / Validation Summary
DIFF reviewed vs CVL + Decision Log. No FE change. No SQL business triggers. All mandatory validation gates PASS (see `VALIDATION_REPORT.md`).

## Test Result
`npm test` — **17/17 PASS** (incl. 1 CADRE unit + 4 Timesheet API).

## Decision Requests
DR-IMP06-001 / 002 / 003 — **RESOLVED** (no open Imp-06 DR).

## Risk Update
R-39 **Closed**.

## Commit
`cddc4e452e71ec3c4090c9e4c3700075b39b984c`

## Next Module
Imp-07 Review & Approval
