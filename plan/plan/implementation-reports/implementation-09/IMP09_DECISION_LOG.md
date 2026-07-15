# IMP09_DECISION_LOG

**Date:** 2026-07-15  
**Status:** Human decisions CLOSED and implemented

---

## DR-IMP09-001 — Transport

| Field | Content |
|---|---|
| **Question** | Unified transport for FE-compatible live refresh? |
| **Winner** | **SSE** (`GET /events`) |
| **Rationale** | FE only needs server→client push; no broadcast/presence/chat/collaborative editing |
| **Rejected** | WebSocket, PG NOTIFY→client, Supabase Realtime, polling-only, Outbox |
| **Evidence** | `IMP09_FE_REALTIME_CONTRACT_REPORT.md`; Human Decision 2026-07-14/15 |

## DR-IMP09-002 — Imp-06 emit under freeze

| Field | Content |
|---|---|
| **Question** | How may Time Recording writes signal Imp-09? |
| **Winner** | **Minimal thaw**: emit after successful COMMIT only |
| **Allowed** | post-COMMIT emit on create/update/delete period (+ sync/auto-approve side effects) |
| **Forbidden** | change validation, TX body, API shape, schema, business behavior |
| **Evidence** | `emitTimesheetEvents.js` + `timesheetService.js` after `withTransaction` |

## DR-IMP09-003 — Imp-07 hooks ownership

| Field | Content |
|---|---|
| **Question** | Who owns `notificationHooks`? |
| **Winner** | **Reuse Imp-07 hooks**; Imp-09 transports only |
| **Forbidden** | move review logic; new parallel bus; duplicate producers |
| **Evidence** | `notificationHooks.emitDomainEvent` → `dispatchDomainEvent`; `reviewDecision` still producer |

---

## Follow-up (not Imp-09)

| Item | Owner |
|---|---|
| FE adapter Supabase → `/events` | Imp-12 |
| Change transport again | Future Decision Log only |
