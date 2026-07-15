# IMP09_IMPLEMENTATION_REPORT

**Date:** 2026-07-15  
**Module:** Imp-09 Notifications / Realtime  
**Status:** **DONE** (hardening complete; awaiting close confirmation)  
**Transport:** SSE (DR-IMP09-001) — unchanged

---

## 1. Summary

Imp-09 delivers server→client push via `GET /events`. Post-review hardening adds config envs, precise ownership docs, Last-Event-ID no-replay clarity, auth security note, lifecycle diagram, and extra tests. **No transport / architecture / business rework.**

## 2. Decisions (unchanged)

| DR | Winner |
|---|---|
| DR-IMP09-001 | SSE |
| DR-IMP09-002 | Imp-06 emit after COMMIT only |
| DR-IMP09-003 | Reuse Imp-07 `notificationHooks` |

## 3. Hardening delta (this pass)

| Item | Change |
|---|---|
| Config | `SSE_HEARTBEAT_MS` (default 30000), `SSE_RETRY_MS` (default 3000) |
| Auth docs | Bearer preferred; query fallback + Security Note |
| Last-Event-ID | Explicit `lastEventIdReplay: false`; ignored for delivery |
| Ownership | `queue.changed` / `dashboard.changed` sources = `dispatcher.*` |
| Tests | auth 401, Bearer connect, cleanup, Last-Event-ID no-replay |
| Docs | Architecture / Traceability / Test / Final |

## 4. DoD

| Criterion | Result |
|---|---|
| SSE transport unchanged | ✓ |
| Architecture unchanged | ✓ |
| Minor review comments handled | ✓ |
| Documentation complete | ✓ |
| Tests + regression PASS | ✓ |
| No business logic change | ✓ |

## 5. Out of scope

Imp-12 FE adapter · replay persistence · Decision Log transport reopen
