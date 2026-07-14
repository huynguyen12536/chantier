# Status Board — Chantier (Consolidation + Replatforming)

> Master Plan: `00_README_EXECUTION.md`  
> Direction (2026-07-14): **Merge 2 legacy systems → 1 FE + 1 Backend + 1 PostgreSQL**

## Phase overview

| Phase | Title | Status | Next Action |
|---|---|---|---|
| 0 | Legacy RE (workspace) | ✅ Done | Treat as Legacy Analysis |
| 1 | Architecture validation (workspace) | ✅ Done | Historical |
| 2 | DB dump investigation | Technical Investigation Complete · Waiting External Confirmation | Label env/system IDs; Legacy evidence |
| 3 | **Merge Specification** | ⬜ Todo | Identify Legacy B; start Merge Spec |
| 4 | Unified Domain Discovery | ⬜ Todo | After P3 |
| 5 | Unified Database Modeling | ⬜ Todo | After P3–4 |
| 6 | Business Logic Consolidation | ⬜ Todo | After P3–5 |
| 7 | Backend Architecture Design | ⬜ Todo | After P6 |
| 8 | Migration Strategy | ⬜ Todo | After P5–7 |
| 9 | API Contract | ⬜ Todo | After P7 |
| 10 | Backend Implementation Planning | ⬜ Todo | After P9 |
| 11 | Data Migration Planning | ⬜ Todo | After P3/5/8 |
| 12 | Testing Strategy | ⬜ Todo | After P9–11 |
| 13 | Deployment / Cutover Strategy | ⬜ Todo | After P8/12 |
| 14 | Production Rollout | ⬜ Todo | After P13 |

## Notes

- Old migration-1:1 phase prep folders = **Superseded** (kept).  
- Do **not** start Unified Backend Design/coding before Merge Spec.  
- SoT chain: Legacy → Merge Spec → Unified Domain → Unified Backend → Unified DB.

## Evidence

- Refactor report: `AGENTIC_FLOW_REFACTOR_REPORT.md`  
- Merge Spec phase: `phases/phase_03_merge_specification/`  
- Legacy SoT gate (historical): `migration-analysis/SOURCE_OF_TRUTH_DECISION.md` (+ Consolidation addendum)
