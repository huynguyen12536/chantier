# AGENTIC EXECUTION MANUAL

**Project Mode:** Consolidation + Replatforming  
**Execution Mode:** Backend-First (Frontend Frozen) · **Auto-Continue**  
**Effective:** 2026-07-14 (updated auto-continue)  
**Authority:** Overrides conflicting Planning-Mode / Human-Approval-between-phases assumptions.  
**Master Plan:** `00_README_EXECUTION.md` · **This file:** runtime operating rules.

---

## 1. PROJECT MISSION

**Consolidation + Replatforming** → Unified Platform (1 FE Frozen + 1 Backend + 1 PostgreSQL), independent of Supabase.

### Terminology (Phase 3+)

| Term | Meaning |
|---|---|
| **Current Verified Legacy (CVL)** | Workspace đã RE đầy đủ (`migration-analysis/`) |
| **Pending Legacy Discovery** | Legacy thứ hai chưa có đủ evidence |
| **Unified Platform** | Đích: FE + Backend + PG duy nhất |

Current Workspace ≠ Final Product.  
`migration-analysis/` = **CVL Source** ≠ Final Business Truth (Merge Spec + Unified Domain = design SoT).

---

## 2. FRONTEND FROZEN

FE hiện tại = **CONTRACT**. Không sửa UI/logic/hooks/routing/auth/API calls/payload/response.  
Backend phải tương thích FE. Muốn đổi Contract → Decision Request (không tự đổi FE).

---

## 3. SOURCE OF TRUTH (đọc đúng thứ tự)

1. Merge Specification  
2. Unified Domain  
3. `migration-analysis/` (CVL Source)  
4. Decision Log  
5. Risk Register  
6. Master Plan  

Conflict → Decision Request. Không tự quyết.

---

## 4. EXECUTION PRINCIPLE

Không clone Supabase — implement business:

| Legacy | Unified Platform |
|---|---|
| Trigger | Domain Event / write-path service |
| Function | Application Service |
| RPC | REST API |
| Auth | JWT + Refresh |
| RLS | RBAC + Permission |
| Edge | Controller + Service |
| Realtime | WS/Event |
| Storage | MinIO/S3 nếu cần |

Open for Future Legacy Merge — không hardcode “chỉ một legacy”.

Không tạo / sửa / bỏ Business Rule CVL trong `migration-analysis/`. Khác với Pending Legacy → Merge Decision.

Code order: Flow → UseCase → Service → Permission → TX → Repo → Controller → DTO → API → DB.

---

## 5. PHASE PIPELINE (bắt buộc — không bỏ)

```
Planner
  → Architect
  → Developer
  → Unit Test
  → Integration Test
  → Regression Test
  → Review
  → Architecture Validation
  → Business Validation
  → Documentation
  → Git Commit
  → Git Push
  → Update Status Board
  → Update Phase Report
```

Mỗi bước ghi: **Input · Output · Evidence · Decision · Confidence · Issues · Next Step · PASS/FAIL**.

Review = **DIFF only**, đối chiếu Merge Spec / Unified Domain / migration-analysis / Decision Log — không cảm tính.

Architecture Validation: chứng minh không mất Business Rule.  
Business Validation: mọi rule trace về `migration-analysis` **hoặc** Decision Log — không trace được = **FAIL**.

---

## 6. AUTO-CONTINUE (không Human Approval giữa Phase)

Sau khi Phase **PASS toàn bộ Quality Gates** (pipeline + AC + Exit Criteria):

1. Commit  
2. Push  
3. Ghi SHA · Branch · Message vào Status Board + Phase Report  
4. Cập nhật Decision Log / Risk Register / Documentation  
5. **Tự động bắt đầu Phase tiếp theo**

**Không** chờ Human Approval giữa các Phase.

### Chỉ được DỪNG khi

- Decision Request chưa được trả lời; **hoặc**  
- Blocker kỹ thuật không giải được bằng evidence; **hoặc**  
- Xung đột với `migration-analysis` (CVL) chưa resolve bằng Decision; **hoặc**  
- Frontend Contract không thể đáp ứng; **hoặc**  
- **Hoàn thành Phase 14** → sinh Final reports rồi dừng.

Ngoài các trường hợp trên: **không được dừng**.

---

## 7. PHASE DONE / QUALITY GATES

Phase PASS khi đủ:

- [ ] Mọi bước pipeline PASS  
- [ ] Acceptance + Exit Criteria PASS  
- [ ] Docs + Decision + Risk updated  
- [ ] Commit + Push + SHA recorded  

Thiếu một mục → Phase **FAIL / IN REVIEW** — **không** auto-continue.

### Git

```
git add .
git commit -m "phase-NN: <why> (pipeline PASS)"
git push
```

Không stage secrets (`.env`, credentials). Không sửa Frontend.

---

## 8. AFTER PHASE 14

Sinh rồi **DỪNG**:

- Final Architecture Report  
- Final Migration Report  
- Final Review Report  
- Final Test Report  

---

## 9. DECISION REQUEST

Khi uncertain — không đoán. Template: Context · Evidence · Options · Recommendation · Impact · Blocked work.

---

## 10. CURRENT POINTER

| Item | Value |
|---|---|
| Mode | Auto-Continue Execution |
| Decision | O3 — CVL continue |
| Start | Phase 3 Merge Specification → … → Phase 14 |
