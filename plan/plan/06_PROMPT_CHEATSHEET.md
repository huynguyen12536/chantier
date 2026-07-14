# Prompt Cheat Sheet — Chantier Agentic Flow

Roots:  
`api-chantier/` (BE) · `chantier1/.../Chantier-web-app-main/` (FE) · `migration-analysis/` (SoT) · `plan/plan/` (governance)

## 1) Execute one task (main prompt)

```
Execute one task end-to-end with strict scope and tracking hygiene.

Task:
- TASK_ID: <TASK_ID>
- TASK_FILE_PATH: plan/plan/phases/<phase>/tasks/<TASK_ID>.md

Read first:
- plan/plan/02_PRP_AI_Execution_Playbook.md
- plan/plan/00_README_EXECUTION.md (phase + inventory)
- plan/plan/03_AGENT_ROUTING.md
- plan/plan/tracking/status_board.md
- SoT paths listed in the task Inputs (migration-analysis/…)
- Task file: In Scope / Out of Scope / Task Type

Rules:
1. Implementation only in api-chantier/ and/or FE root per task.
2. Do not invent Super Admin / multi-company unless task In Scope says so.
3. Status board: Todo → In Progress → In Review → Done.
4. Primary Agent → Supporting → Required Reviews from task metadata.
5. In Scope only. Cite SoT for legacy behavior claims.

Output: summary, test evidence, risk notes, files changed, SoT refs, final status.
```

## 2) Draft a new task (no implementation)

```
I need a new Chantier migration task. Do NOT implement yet.

Request: <e.g. Port trigger_sync_declarations to timesheet service>

1. Align with phase in plan/plan/00_README_EXECUTION.md
2. Propose TASK_ID, Task Type, In Scope, Out of Scope, Acceptance Criteria, agents.
3. List SoT files to cite (migration-analysis/…).
4. Create task from plan/plan/templates/TASK_TEMPLATE.md
5. Add row to plan/plan/tracking/status_board.md (Todo)
6. Show draft for approval before any code changes.
```

## 3) Start next recommended phase work

```
Read plan/plan/00_README_EXECUTION.md status board and migration-analysis/SUMMARY.md.
Propose concrete task files for the next incomplete phase (currently Phase 1 then Phase 2).
Do not implement until I approve the task files.
```

## 4) Review only

```
Review task <TASK_ID> implementation only.
Check acceptance criteria, security, migrations/triggers parity, regressions, tests.
Required: Code Reviewer; Security Engineer if auth/DB/RLS/Edge/Docker secrets.
```

## 5) Daily start

```
Read plan/plan/tracking/status_board.md and pick the highest-priority unblocked Todo.
Execute using prompt section 1. Prefer Phase order in 00_README_EXECUTION.md.
```

## Agents

Frontend Developer · Backend Architect · Database Optimizer · DevOps Automator · Security Engineer · API Tester · Technical Writer · Product Manager · Software Architect · Senior Developer · Code Reviewer · Infrastructure Maintainer

See `03_AGENT_ROUTING.md`.
