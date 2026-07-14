# PRP: AI Execution Playbook — Chantier

## 1. Mission

Khi **đã có task file**, agent thực thi đúng scope, đọc SoT đúng tầng, review đủ, cập nhật tracking.

**Project goal:** Consolidation + Replatforming (không clone / 1:1 Supabase).

Không có task file → **không** implement nghiệp vụ. Có thể nhờ agent **soạn task** trước (cần duyệt).

## 2. Repository roots

| Work | Root |
|---|---|
| Unified Backend (scaffold) | `api-chantier/` |
| Frontend legacy (workspace / candidate A) | `chantier1/Chantier-web-app-main/Chantier-web-app-main/` |
| Legacy Analysis | `migration-analysis/` |
| Merge Analysis (Phase 3+) | `migration-analysis/merge/` |
| Unified Analysis (Phase 4+) | `migration-analysis/unified/` |
| Governance | `plan/plan/` |

## Design SoT chain

Legacy Sources → **Merge Specification** → Unified Domain → Unified Backend → Unified PostgreSQL

## 3. Inputs per task execution

Agent **bắt buộc** đọc:

1. Task file (`phases/.../tasks/<ID>.md`)
2. SoT đúng tầng (Legacy / Merge Spec / Unified) — không suy đoán từ Hawk/legacy khác
3. `01_CURRENT_SYSTEM_STATE.md` (tóm tắt)
4. `00_README_EXECUTION.md` — Consolidation phases
5. `03_AGENT_ROUTING.md`, `04_GLOBAL_GATES.md`
6. `tracking/status_board.md`

## 4. Standard loop

1. Read task + linked SoT docs  
2. Confirm In Scope / Out of Scope + **Task Type** (Analysis|Design|Implementation|Validation|Documentation)  
3. Status board → **In Progress**  
4. **Senior Developer** first nếu Implementation/feature  
5. **Primary Agent** executes  
6. **Required Review Agents**  
7. Output: summary · evidence · risks · files changed · SoT refs used  
8. Status board → **In Review** → **Done**  
9. `decision_log.md` nếu đổi scope / architecture / Keep-Port-Drop / Merge conflicts  

---

*(Sections 5+ unchanged in spirit — honor Consolidation bans: no premature Backend code, no inventing System B.)*

## 5. Quality

- No Done without acceptance criteria evidence  
- No unresolved Critical/High findings  
- **Security Engineer** nếu auth, DB, RLS→authZ, Edge/JWT, Docker secrets, data migration  
- **API Tester** nếu đóng E2E flow (login → declare → validate → export)  
- Implementation trong `api-chantier/` hoặc FE path đúng task — **không** sửa SoT trừ Documentation được phép  

## 6. Phase discipline

- Không nhảy cóc graph trong `00_README_EXECUTION.md` (trừ Analysis Phase 1–2).  
- Scaffold Docker ≠ Phase 4/9 Done.  
- Mọi Trigger/Function/RPC/Edge trong inventory SoT phải có Keep/Port/Drop trước khi tắt legacy path.

## 7. Escalation (>24h blocked)

1. Blocker trên status board  
2. Hai options + trade-offs  
3. Log `decision_log.md`  
4. Continue hoặc reprioritize  
