# Status Board — Chantier (Execution Mode)

> Master Plan: `00_README_EXECUTION.md`  
> **Operating rules:** `AGENTIC_EXECUTION_MANUAL.md`  
> Mode: **Consolidation + Replatforming** · **Backend-First** · **Frontend FROZEN**

## Phase overview

| Phase | Title | Status | Next Action |
|---|---|---|---|
| 0 | Legacy RE (workspace) | ✅ Done | Legacy Analysis only |
| 1 | Architecture validation | ✅ Done | Historical |
| 2 | DB dump investigation | Technical Investigation Complete · Waiting External Confirmation | Track L labeling (parallel) |
| 3 | **Merge Specification** | 🔄 **IN PROGRESS** — Planner Done · blocked DR-P3-001 | Human resolves DR → Architect |
| 4 | Unified Domain Discovery | ⬜ Todo | After P3 Human Approval |
| 5 | Unified Database Modeling | ⬜ Todo | After P3–4 |
| 6 | Business Logic Consolidation | ⬜ Todo | After P3–5 |
| 7 | Backend Architecture Design | ⬜ Todo | After P6 |
| 8 | Migration Strategy | ⬜ Todo | After P5–7 |
| 9 | API Contract | ⬜ Todo | After P7 — must match FE Frozen |
| 10 | Backend Implementation Planning | ⬜ Todo | After P9 |
| 11 | Data Migration Planning | ⬜ Todo | After P3/5/8 |
| 12 | Testing Strategy | ⬜ Todo | After P9–11 |
| 13 | Deployment / Cutover Strategy | ⬜ Todo | After P8/12 |
| 14 | Production Rollout | ⬜ Todo | After P13 |

## Phase 3 pipeline

| Step | Status |
|---|---|
| Planner | ✅ `phases/phase_03_merge_specification/PLANNER_PACKAGE.md` |
| Architect | ⬜ Blocked — DR-P3-001 |
| Developer* (docs) | ⬜ |
| Test / Review / Arch Val / Biz Val / Docs | ⬜ |
| Human Approval | ⬜ |

## Open Decision Requests

| ID | Title | Status |
|---|---|---|
| [DR-P3-001](DECISION_REQUESTS/DR-P3-001_system_ab_identity.md) | System A/B identity | ⏳ Waiting Human |

## Notes

- FE Frozen: không sửa UI/logic/API calls FE.  
- Không clone Supabase; Backend implement business khớp FE Contract.  
- SoT read order: Merge Spec → Unified Domain → Legacy → Decision → Risk → Master Plan.  
- **Sau mỗi Phase:** subagent review PASS → **git commit + git push** (Execution Manual §7).

## Evidence

- Execution Manual: `AGENTIC_EXECUTION_MANUAL.md`  
- Planner pack: `phases/phase_03_merge_specification/PLANNER_PACKAGE.md`  
- DR-P3-001: `tracking/DECISION_REQUESTS/DR-P3-001_system_ab_identity.md`
