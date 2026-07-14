# Task: <TASK_ID> — <Short Title>

## Task Metadata
- Task ID: <TASK_ID>
- Phase: <phase_NN_… or standalone>
- Status: Todo
- Priority: High | Medium | Low
- **Task Type:** Analysis | Design | Implementation | Validation | Documentation
- Primary Agent: <see 03_AGENT_ROUTING.md>
- Supporting Agents: <optional>
- Required Review Agents: <e.g. Code Reviewer, Security Engineer>
- Estimated Effort: <e.g. 0.5 day>
- Dependencies: <TASK_ID or None>

## Problem and Outcome

**Problem:** <what is wrong or missing>

**Expected outcome:** <what "done" looks like>

## In Scope
- <bullet>
- <bullet>

## Out of Scope
- <bullet — prevents scope creep>
- Super Admin / multi-company (unless explicitly in scope)

## Inputs (SoT + plan)
- `plan/plan/00_README_EXECUTION.md` (phase section)
- `plan/plan/01_CURRENT_SYSTEM_STATE.md`
- `migration-analysis/<file>` — <why>
- `tracking/status_board.md`

## Implementation Root
- [ ] `api-chantier/`
- [ ] `chantier1/Chantier-web-app-main/Chantier-web-app-main/`
- [ ] `migration-analysis/` (Documentation updates only)
- [ ] `plan/plan/` (governance only)

## Acceptance Criteria
- [ ] <measurable criterion>
- [ ] <tests / manual steps / dump diff evidence>
- [ ] Status board updated
- [ ] No unresolved Critical/High review findings
- [ ] Legacy behavior claims cite SoT paths

## Definition of Done
- All acceptance criteria checked
- Evidence: summary, proof, risks, files changed, SoT refs
- Required reviews completed
- Gates in `04_GLOBAL_GATES.md` for this task type

## Execution Prompt (optional)

```
Execute task <TASK_ID> per plan/plan/02_PRP_AI_Execution_Playbook.md.
Task file: plan/plan/phases/<phase>/tasks/<TASK_ID>.md
In Scope only. Update tracking/status_board.md when done.
```
