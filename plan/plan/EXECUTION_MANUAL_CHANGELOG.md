# EXECUTION_MANUAL_CHANGELOG

| Date | Change | Why |
|---|---|---|
| 2026-07-14 | Added **DATABASE EVOLUTION INVARIANTS** (Rules 1–10) | Imp-05 destructive assumption governance fix |
| 2026-07-14 | Reordered Source of Truth / Evidence Priority to match Rule 6 | Decision Log first; dumps cannot invalidate higher SoT |
| 2026-07-14 | Review step: classify P0–P3; P2 Legacy Difference ≠ auto-defect | Prevent clone-of-dump FAIL noise |
| 2026-07-14 | Linked `DATABASE_EVOLUTION_POLICY.md` as binding policy | Single canonical policy file |
| 2026-07-14 | Updated Current pointer: governance update; **Imp-07 STOP** | Explicit human gate after Imp-05 rework |
| 2026-07-14 | Current pointer → Imp-07 PASS; Imp-06 frozen | Human authorized Review & Approval Wave2 |
| 2026-07-14 | Current pointer → Imp-08 PASS; STOP Imp-09 | Human authorized Reporting & Export |

## New invariants (short)

- UNION database  
- Absence is not evidence  
- Additive migrations default  
- KEEP on disagreement  
- Removal = Review + BizVal + Merge Spec + Decision Log + Human  
- No rewrite of applied migration history  
- No silent architecture decisions  

## Affected documents

- `AGENTIC_EXECUTION_MANUAL.md`  
- `DATABASE_EVOLUTION_POLICY.md`  
- `DATABASE_GOVERNANCE_UPDATE.md`  
- `00_README_EXECUTION.md`  
- `tracking/decision_log.md`  
- `tracking/status_board.md`  
- Imp-05 schema/rework reports (wording)  
- `migration-analysis/merge/00_MERGE_OVERVIEW.md` (UNION reminder)
