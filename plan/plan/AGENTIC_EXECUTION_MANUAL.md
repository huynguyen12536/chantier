# AGENTIC EXECUTION MANUAL

**Project Mode:** Consolidation + Replatforming  
**Execution Mode:** Backend-First (Frontend Frozen)  
**Effective:** 2026-07-14  
**Authority:** Overrides conflicting Planning-Mode assumptions when they contradict this Manual.  
**Master Plan:** `00_README_EXECUTION.md` (roadmap) · **This file:** runtime operating rules for agents.

---

## 1. PROJECT MISSION

Dự án đã chuyển từ **Planning Mode** sang **Execution Mode**.

| Không còn là | Là |
|---|---|
| Reverse Engineering (primary) | Consolidation + Replatforming |
| Clone Supabase | Implement Business trên Backend mới |
| FE adapts to BE | **BE adapts to FE Contract** |

### Target

```
Hai Frontend Legacy
        ↓
Một Frontend duy nhất  (FROZEN — không chỉnh sửa trong Execution Mode này)
        ↓
Một Backend hoàn toàn mới
        ↓
Một PostgreSQL duy nhất
        ↓
Hệ thống độc lập với Supabase
```

---

## 2. FRONTEND FROZEN

Frontend hiện tại = **CONTRACT bất biến**.

**KHÔNG được:**

- sửa UI / component / navigation / routing  
- sửa logic FE / service / hooks / state  
- sửa authentication flow trên FE  
- sửa API call / payload / response expectation  

**Nguyên tắc:** Backend phải tương thích với Frontend. Không phải Frontend tương thích với Backend.

Nếu Backend muốn đổi Contract → **Reject** (hoặc Decision Request lên Human — không tự đổi FE).

---

## 3. GLOBAL SOURCE OF TRUTH (đọc đúng thứ tự)

| Level | Artifact | Vai trò |
|---|---|---|
| **1** | **Merge Specification** | Business Truth (design hợp nhất) |
| **2** | **Unified Domain Model** | Architecture Truth |
| **3** | `migration-analysis/` | Legacy Truth (tables, triggers, functions, edge, auth, rls, flows, diagrams, readiness) |
| **4** | Decision Log | Quyết định đã chốt |
| **5** | Risk Register | Rủi ro mở / mitigation |
| **6** | Master Plan | Roadmap / phase goals |

Mâu thuẫn giữa các level → **KHÔNG tự quyết** → sinh **Decision Request**.

Khi Merge Spec / Unified Domain chưa tồn tại: Level 3 + 4 + 5 + 6 vẫn ràng buộc; **không bịa** Level 1–2 — tạo chúng trong đúng Phase (3, 4).

---

## 4. EXECUTION PRINCIPLE — Implement Business (không clone Supabase)

| Legacy Supabase | Backend mới |
|---|---|
| Trigger | Domain Event / application write-path |
| Function | Application Service |
| RPC | REST API |
| Auth | JWT + Refresh Token |
| RLS | RBAC + Permission Layer |
| Edge Function | Controller + Service |
| Realtime | WebSocket / Event |
| Storage | MinIO / S3 (nếu cần) |

Không copy cơ học. Giữ **Business Behaviour**. Database ≠ SoT — Business / Domain → rồi Database.

### Implementation order (khi viết code)

```
Business Flow → Use Case → Service → Permission → Transaction
→ Repository → Controller → DTO → API → Database
```

Không implement “database-first”.

---

## 5. FRONTEND CONTRACT (Backend obligations)

Backend phải đúng: payload · endpoint · status · validation · error format · pagination · sorting · filtering · authentication · permission.

Mọi thay đổi Contract → Reject / Decision Request.

---

## 6. PHASE PIPELINE (bắt buộc — không bỏ bước)

```
Planner Agent
    ↓
Architect Agent
    ↓
Developer Agent
    ↓
Test Agent
    ↓
Review Agent
    ↓
Architecture Validation Agent
    ↓
Business Validation Agent
    ↓
Documentation Agent
    ↓
Human Approval
```

Sau mỗi Phase: **DỪNG** — chỉ sang Phase tiếp khi Human approve.

### Vai trò

| Agent | Được làm | Không được |
|---|---|---|
| **Planner** | Đọc Phase / Merge Spec / migration-analysis / Decision; sinh Task Breakdown, Dependency Graph, Execution Order | Viết code |
| **Architect** | Domain, Aggregate, Entity, VO, Repository, Use Case, Transaction/Permission boundary | Implement |
| **Developer** | Implement đúng task | Redesign / mở rộng / thêm feature / đổi business |
| **Test** | Unit / Integration / Regression / Business / Permission / Transaction tests | Ignore fail — fail → Rollback Task |
| **Review** | Review **DIFF** only (Clean Arch, SOLID, DRY, KISS, TX, logging, errors, naming, dead code, security, perf, deps, circular, leak, concurrency, race, validation) | Review cả repo không cần thiết |
| **Architecture Validation** | Business rule vs Merge Spec / Unified Domain / Legacy / Decision | Cho qua khi khác Legacy mà không có Decision |
| **Business Validation** | Mapping Trigger→Service, Function→UseCase, RPC→Endpoint, … | Cho qua nếu không map được |
| **Documentation** | Status Board, Decision Log, Risk, ADR, Phase/Arch/Test/Review reports | Sửa Legacy Documentation |

---

## 7. PHASE COMPLETION (Done chỉ khi đủ)

Phase = **DONE** khi và chỉ khi:

- [ ] Planner Done  
- [ ] Architecture Done  
- [ ] Implementation Done (artifact đúng loại phase — docs hoặc code)  
- [ ] Review PASS  
- [ ] Test PASS  
- [ ] Regression PASS  
- [ ] Business PASS  
- [ ] Documentation Updated  
- [ ] Decision Updated  
- [ ] Risk Updated  
- [ ] Acceptance Criteria PASS  
- [ ] Exit Criteria PASS  
- [ ] **Subagent Review PASS** (Review + Architecture Validation + Business Validation)  
- [ ] **Git commit** của toàn bộ thay đổi phase (message nêu phase + kết quả)  
- [ ] **Git push** lên remote tracking branch  

Thiếu một mục → Phase vẫn **IN REVIEW**.

### Git rule (sau mỗi Phase)

Sau khi pipeline phase hoàn tất và **subagent review đã PASS** (không còn Critical/High mở trong scope phase):

1. `git status` / `git diff` — chỉ stage artifacts của phase (không stage secrets `.env`, credentials).  
2. **Commit** với message dạng: `phase-NN: <short why> (review PASS)`.  
3. **Push** lên remote (`git push -u` nếu branch mới).  
4. Ghi Evidence Link (commit SHA / remote URL) vào Status Board + Phase Report.  

**Không** commit/push khi Review / Arch Val / Biz Val còn FAIL hoặc đang chờ Decision Request blocker.  
**Không** sửa Frontend trong commit (FE Frozen).  
Interim work (Planner-only, đang chờ DR) có thể commit/push **governance** nếu Human yêu cầu — không đánh dấu Phase DONE.

---

## 8. GLOBAL RULES

1. Không sửa Frontend / không yêu cầu FE đổi.  
2. Không đổi API Contract / Payload / Response / Auth flow / Navigation / UI (phía FE).  
3. Mọi thay đổi hệ thống mới nằm ở **Backend** (+ docs governance / Merge Spec / Domain).  
4. Không clone Supabase.  
5. Không đoán — thiếu thông tin → **Decision Request**.  
6. Không sửa Legacy Documentation (`migration-analysis/` facts lịch sử) — chỉ thêm Merge/Unified/new reports.  
7. Thực hiện **tuần tự từ Phase 3**; sau mỗi Phase dừng chờ Human.

---

## 9. DECISION REQUEST (khi uncertain)

Template tối thiểu:

```markdown
# Decision Request — <ID>

## Context
## Evidence
## Options
## Recommendation
## Impact
## Blocked work
## Requested from Human
```

Chờ Human. Không tự thiết kế thay Decision.

---

## 10. PHASE END REPORT PACK (bắt buộc trước khi xin approval)

Mỗi Phase kết thúc với:

1. Phase Report  
2. Code Review Report *(N/A nếu phase docs-only — ghi rõ)*  
3. Architecture Review Report  
4. Business Validation Report  
5. Test Report *(N/A nếu docs-only — ghi rõ)*  
6. Documentation Report  
7. Decision Summary  
8. Risk Summary  
9. **Git commit SHA + push remote confirmation** (sau subagent review PASS)

Human Approval → rồi mới Phase tiếp theo.

---

## 11. CURRENT EXECUTION POINTER

| Item | Value |
|---|---|
| Active Phase | **3 — Merge Specification** |
| Mode | Execution · Backend-First · FE Frozen |
| Pipeline step | Bắt đầu bằng **Planner** |
| Human gate | Sau đủ pipeline Phase 3 → Approval |

Xem: `phases/phase_03_merge_specification/`
