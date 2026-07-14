# Phase <NN> — <Phase Title>

> Align with **Phase NN** in `00_README_EXECUTION.md` (Goal / Inputs / Outputs / Acceptance Criteria).  
> Project = **Consolidation + Replatforming** (not clone / 1:1 Supabase).

## Objective
<one sentence — why this group of tasks exists>

## SoT Inputs
- Legacy: `migration-analysis/<…>`
- Merge: `migration-analysis/merge/<…>` (from Phase 3)
- Unified: `migration-analysis/unified/<…>` (from Phase 4+)
- Master Plan section: Phase <NN>

## Timebox
<optional>

## Tasks

| Task | Title | Type | Primary Agent | Priority | Dependencies |
|---|---|---|---|---|---|
| [<TASK_ID>](tasks/<TASK_ID>.md) | <title> | Analysis\|Design\|… | <agent> | High | None |

## Entry Criteria
- [ ] Previous phase Exit Criteria met (per Consolidation dependency graph)
- [ ] <what must be true before starting>

## Exit Criteria
- [ ] All tasks Done
- [ ] Phase Acceptance Criteria in Master Plan satisfied
- [ ] Gates in `04_GLOBAL_GATES.md` satisfied
- [ ] Risks updated in `05_RISK_REGISTER.md` if needed

## Risks
- See `05_RISK_REGISTER.md` / Master Plan phase Risks (incl. merge/conflict risks R-20+)

## Notes
- Execute in dependency order unless `decision_log.md` says otherwise.
- Update `tracking/status_board.md` after every status change.
- Do not invent System B or Super Admin scope without decision_log.
- Do not treat scaffold `501` as Backend Done.
