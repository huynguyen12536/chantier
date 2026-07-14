# DECISION_VERIFICATION.md — Imp-09 Realtime / Transport

**Date:** 2026-07-14  
**Scope:** Toàn bộ `migration-analysis/` + Decision Log + ADR liên quan Realtime  
**Rule:** Không suy diễn. Không chọn transport nếu SoT không chốt.

---

## Bước 1 — Kết luận xác minh

### 1. Transport đã được quyết định chính thức chưa?

# **KHÔNG.**

Không có Decision Log winner chọn **một** trong: SSE | WebSocket | PG NOTIFY | Supabase Realtime | Outbox | Domain-events-only | Polling.

Không có đoạn SoT nào viết dạng: “Unified Platform **shall** use \<X\> as the notification transport.”

### 2. Realtime contract (yêu cầu hành vi) là gì?

Đã có **contract nghĩa / phạm vi**, chưa có transport.

| Nhu cầu CVL | Evidence | Ai refresh |
|---|---|---|
| Worker self update | `timesheet.tsx` `postgres_changes` `periodes_travail` + `declarations_heures` filter `user_id=eq.{self}` | Ouvrier own rows |
| Chef dashboard refresh | `chef-dashboard.tsx` channel `chef_dashboard_{id}` on `periodes_travail` | Chef team-pending |
| Approval / validation refresh | `validation.tsx` both tables | Reviewers |
| Payroll refresh | **Không** có subscription realtime trên `export.tsx` / Flow F | Export = đọc theo demand; **không** là requirement Imp-09 từ inventory |
| “Notification” riêng (email/push) | **Không** evidence CVL | Không assert |

FE timesheet còn **poll interval** (fallback client) — đây là hành vi FE frozen, **không** phải quyết định transport Unified Backend.

### 3. Transport được chỉ định là gì?

# **Không chỉ định (Deferred).**

Các câu SoT gần nhất — và vì sao **không** đủ để implement:

| Nguồn | Trích yếu | Interpretation hợp lệ |
|---|---|---|
| `MERGE_DECISION_MATRIX.md` L14 | Realtime → **Keep as contract / Defer mechanism** | Giữ nhu cầu sự kiện; **cơ chế trì hoãn** |
| `01_KEEP_PORT_DROP_MATRIX.md` L20 | Realtime → Keep contract / **defer mechanism** · Notification boundary | Same |
| `02_BOUNDED_CONTEXTS.md` L16 | Notification · **Select mechanism later** | Cơ chế chọn sau |
| ADR-001 L27 | Notification · **transport selected later** | Same |
| `conflict_register.md` C-06 | Status **Open** | Chưa đóng |
| `FE_COMPATIBILITY_ADAPTERS.md` L18 | `/events` · **SSE/WS transport selected during implementation** | Liệt kê **ứng viên** SSE **hoặc** WS; **chưa chọn**; “during implementation” ≠ Decision Log winner |
| `openapi.yaml` L30–31 | `GET /events` “Realtime-compatible … event stream” | Design-only path; không chọn SSE vs WS |
| `SOURCE_OF_TRUTH_DECISION.md` | Không đề cập realtime/transport | N/A |
| `SHARED_BUSINESS_RULES.md` | Không có rule transport | N/A |
| Decision Log | Không có row “Transport = X” | Chỉ có gate STOP / DR mở |

**Cấm suy luận:** Không được coi dòng “SSE/WS … selected during implementation” là quyết định SSE hoặc WebSocket.

---

## Evidence register (file / section)

| File | Section / lines | Verdict on transport decision |
|---|---|---|
| `migration-analysis/SUMMARY.md` | L22, L54 | Mô tả FE dùng realtime — không chọn BE transport |
| `SHARED_BUSINESS_RULES.md` | all | Không |
| `business-flows.md` | Flow E L81 | “Realtime subscription” mô tả CVL — không transport BE |
| `FLOW_CONTRACTS.md` | D/E “events” | Contract ops; không transport |
| `SOURCE_OF_TRUTH_DECISION.md` | — | Không |
| ADR-001 | Module map Notification | **selected later** |
| `MERGE_DECISION_MATRIX.md` | Realtime row | **Defer mechanism** |
| `realtime_mapping.md` | full | Yêu cầu equivalent notifications; không transport |
| `fe_contract_matrix.md` | Realtime row | publish equivalent updates |
| `CONFLICT_MATRIX.md` / `conflict_register.md` | **C-06 Open** | Unresolved |
| `FE_COMPATIBILITY_ADAPTERS.md` | L18 | SSE/WS **candidates**, chọn sau |
| `openapi.yaml` | `/events` | Design stub |
| `LEGACY_SPECIFIC_RULES.md` | realtime row | Document contract before cutover |
| `database-schema.md` §7 | dump empty publication | Drift evidence |
| `frontend-supabase-usage.md` §194–206 | FE channels | CVL inventory |
| Decision Log | Không winner transport | — |

---

## Official conclusion

**Imp-09 BLOCKED.**

Không được invent: WebSocket, SSE, PG NOTIFY, Supabase Realtime, Outbox, Polling backend, Event Bus productized.

Không sửa Imp-05–08. Không migration / endpoint / emitter / gateway realtime cho đến khi Decision Log đóng DR transport.
