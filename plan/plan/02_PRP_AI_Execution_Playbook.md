# PRP: AI Execution Playbook — Chantier

## 0. Mandatory first read

1. [`AGENTIC_EXECUTION_MANUAL.md`](AGENTIC_EXECUTION_MANUAL.md)  
2. Active Phase folder + Planner package  
3. Open Decision Requests under `tracking/DECISION_REQUESTS/`

## 1. Mission

**Execution Mode:** Consolidation + Replatforming · **Backend-First** · **Frontend FROZEN**.

Khi **đã có task file** và phase pipeline cho phép bước hiện tại: thực thi đúng scope, đọc SoT đúng Level, review đủ, cập nhật tracking.

Không có task / sai bước pipeline → **không** implement. Thiếu thông tin → **Decision Request** (không đoán).

## 2. Repository roots

| Work | Root |
|---|---|
| Unified Backend | `api-chantier/` only (business code) |
| Frontend (FROZEN) | `chantier1/...` — **read-only contract** |
| Legacy Analysis | `migration-analysis/` |
| Merge Analysis | `migration-analysis/merge/` |
| Unified Analysis | `migration-analysis/unified/` |
| Governance | `plan/plan/` |

## 3. SoT read order (Manual Levels)

1. Merge Specification  
2. Unified Domain Model  
3. `migration-analysis/` (Legacy)  
4. Decision Log (+ open DRs)  
5. Risk Register  
6. Master Plan  

Conflict → Decision Request.

## 4. Inputs per task execution

1. Task file  
2. SoT levels applicable  
3. `01_CURRENT_SYSTEM_STATE.md`  
4. `00_README_EXECUTION.md`  
5. `03_AGENT_ROUTING.md`, `04_GLOBAL_GATES.md`  
6. `tracking/status_board.md`  
7. FE Contract inventory (when touching API) — **không sửa FE**

## 5. Phase pipeline (no skip)

Planner → Architect → Developer → Test → Review → Architecture Validation → Business Validation → Documentation → **Human Approval**

## 6. Standard loop (within allowed pipeline step)

1. Confirm pipeline step + In/Out of Scope + Task Type  
2. Status → In Progress  
3. Execute only allowed work for role  
4. Tests / validations as required  
5. Review **diff**  
6. Docs + Decision + Risk updates  
7. Status → In Review → Done (or Blocked + DR)

## 7. Hard bans

- No Frontend edits  
- No Contract changes without Human Decision  
- No Supabase clone-as-goal  
- No inventing System B / business rules  
- No Legacy doc rewrite (facts)  
