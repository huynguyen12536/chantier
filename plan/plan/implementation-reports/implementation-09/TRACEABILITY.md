# TRACEABILITY.md — Imp-09 Realtime (Decision Verification)

**Status:** Contract traced · **Transport NOT decided** · Implementation forbidden until Decision Log

## Contract requirements (CVL → Unified need)

| ID | CVL evidence | Screen | Tables | Scope filter | Unified obligation |
|---|---|---|---|---|---|
| RT-1 | `frontend-supabase-usage.md` §200–204 | timesheet | periods + declarations | `user_id = self` | Scoped refresh equivalent |
| RT-2 | same | validation | both | reviewer visibility | Queue/list refresh equivalent |
| RT-3 | same | chef-dashboard | periods | team/chantier scope | Pending refresh equivalent |
| RT-4 | Flow E `business-flows.md` L81 | — | — | — | Live validation path assumes subscription |
| RT-5 | `realtime_mapping.md` | all three | — | — | Deliver **equivalent** notifications |
| RT-6 | `fe_contract_matrix.md` Realtime | — | postgres changes | — | Publish equivalent updates |
| RT-7 | MERGE matrix Realtime | — | — | — | Keep contract; **defer mechanism** |
| RT-8 | Flow F / export | export.tsx | **no** realtime channel in inventory | — | **Out of Imp-09 realtime contract** |

## Non-requirements (do not invent)

| Topic | Evidence |
|---|---|
| Email / push notification product | Absent in CVL inventory |
| Fixed transport SSE-only or WS-only | Absent as Decision Log winner |
| Payroll live push | Absent FE subscription |

## Backend mapping (current)

| Need | Backend today | Freeze |
|---|---|---|
| Review-path signal | Imp-07 `notificationHooks.emitReviewEvent` (in-process) | Imp-07 **FROZEN** — no relocate without DR |
| Worker write signal | Not emitted | Imp-06 **FROZEN** |
| Client transport API | None | Waiting Decision Log |
| FE postgres_changes | Still FE→Supabase | FE **FROZEN** |

## Decision gaps (must not fill by invention)

| Gap | Required artifact |
|---|---|
| Transport winner | Decision Log (answers DR-IMP09-001) |
| Imp-06 emit policy under freeze | Decision Log (DR-IMP09-002) |
| Hook ownership Imp-07 vs Imp-09 | Decision Log (DR-IMP09-003) |
| C-06 runtime publication | External/runtime confirmation |
