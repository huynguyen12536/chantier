# Tracking Playbook — Chantier

Canonical status: `tracking/status_board.md`  
Master Plan: `00_README_EXECUTION.md` (**Consolidation + Replatforming**)

## Lifecycle

Todo → In Progress → In Review → Done (or Blocked)

## When to update

| Event | Action |
|---|---|
| Tạo task mới | Thêm dòng Todo + Type + Next Action |
| Bắt đầu làm | In Progress + Start Date |
| Code/analysis xong | In Review + evidence draft |
| Review pass | Done + Evidence Link |
| Kẹt | Blocked + blocker text |
| Đổi phase status | Cập nhật bảng Phase overview |
| Merge conflict decided | Decision Log + conflict_register |

## Decision log

Append khi: scope, architecture, security, Keep/Port/Drop, **Merge A/B decisions**, dependency order, hoặc timeline thay đổi.

## Evidence

| Loại | Path |
|---|---|
| Backend scaffold | `api-chantier/` |
| Frontend legacy | `chantier1/.../Chantier-web-app-main/` |
| Legacy Analysis | `migration-analysis/` |
| Merge Spec | `migration-analysis/merge/` |
| Unified Analysis | `migration-analysis/unified/` |
| Governance | `plan/plan/` |
| SoT / docs RE | `migration-analysis/` |
| Governance | `plan/plan/` |

## Rules riêng Chantier

- Không đánh Done Phase 4/9 chỉ vì scaffold `501`.  
- Task Implementation phải cite SoT nếu đụng logic legacy.  
- Phase order mặc định: không skip Phase 2 dump trước schema strategy (Phase 8).  
