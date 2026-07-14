# BLOCKER_REPORT.md — Imp-09

**Verdict:** **Imp-09 BLOCKED**  
**May implement Imp-09 code?** **NO**

---

## Gap analysis — migration-analysis vs backend

| Area | migration-analysis | Backend hiện tại | Gap |
|---|---|---|---|
| Live update **contract** | Keep · equivalent scoped events | Partial (Imp-07 in-process hooks only) | Full surface not delivered |
| **Transport** | Deferred / select later / C-06 Open | Absent | **BLOCKER** |
| Worker period/declaration emits | Required for RT-1/RT-3 | Imp-06 không emit | Blocked by freeze + DR-002 |
| Review emits | Required for RT-2 | Imp-07 hooks, no wire to client | Transport blocked |
| FE cutover adapter `/events` | Design stub SSE/WS TBD | Not implemented | Belongs decision + likely Imp-09/12 after DR |
| Payroll realtime | Not in FE inventory | Imp-08 read-only export | No gap for Imp-09 |

### Frozen — không sửa

- Imp-05, Imp-06, Imp-07, Imp-08  
- Frontend (`chantier1/`)  
- Decision Logs đã đóng (DR-IMP06-*)  

### Forbidden until Decision Log

- migration realtime/outbox  
- endpoint `/events` / stream / WS gateway  
- notification service as product  
- event emitter architecture  
- invent SSE / WS / NOTIFY / Outbox / Polling / Event Bus  

---

## Vì sao không được implement Imp-09

1. Không có Decision Log chọn transport.  
2. C-06 vẫn **Open**.  
3. MERGE + ADR + Bounded Context cùng nói **defer / later**.  
4. `FE_COMPATIBILITY_ADAPTERS` L18 chỉ liệt kê **SSE/WS** như lựa chọn lúc implement — **không** phải quyết định chính thức.  
5. Invent transport = vi phạm “Never invent behavior”.

---

## Phase tiếp theo đề xuất (không phụ thuộc Imp-09)

### **Imp-11 — Administration**

| Field | Value |
|---|---|
| Roadmap | `WAVE2_IMPLEMENTATION_ROADMAP.md` Imp-11 |
| Depends On | Imp-02, Imp-03 **only** |
| Does **not** depend on | Imp-09, Imp-10 |
| SoT | Flow A extras / management guards; `permissions_mapping`; FE `management.tsx` / `admin-users.tsx` / demotion guard (SUMMARY #3); already partially in Imp-03 — Imp-11 closes evidenced admin ops |

**Vì sao không phụ thuộc Imp-09:** Administration = user/role/config lifecycle commands & reads. Không yêu cầu live subscription transport. Realtime không nằm trên critical path admin.

**Imp-10 Background Jobs** — **không** đề xuất tiếp theo: roadmap Depends On **Imp-09**.

**Imp-12 Integration Adapters** — phụ thuộc nhiều module gồm realtime adapter; nên sau khi có transport DR + đủ domain modules.

### Checklist Imp-11 (implementation khi Human authorize)

1. Reverse FE management/admin-users + SUMMARY #2/#3 + RLS demotion/zone ownership.  
2. Traceability matrix vs Imp-03/05 already delivered (avoid duplicate).  
3. Ambiguity → Decision Request (không invent Super Admin / multi-company — already out of scope).  
4. Additive APIs only; FE frozen adapters.  
5. No Imp-05–08 redesign.  
6. Unit / integration / regression Imp-01–08.  
7. Reports + commit + push.  
8. **Không** auto-start Imp-09/10.

### Risks nếu nhảy Imp-11

| Risk | Mitigation |
|---|---|
| Overlap với Imp-03 Users | Trace; only close CVL gaps left |
| Touch affectations soft-end / demotion | Reuse Imp-05 ownership; no redefine |
| Scope creep Super Admin | Decision Log out-of-scope stands |

---

## Output gate

| Question | Answer |
|---|---|
| Implement Imp-09 now? | **NO** |
| Next implementable module | **Imp-11 Administration** (after Human authorize) |
| Waiting on | Decision Log answers for DR-IMP09-001/002/003 **and/or** C-06 if Imp-09 resumes |
