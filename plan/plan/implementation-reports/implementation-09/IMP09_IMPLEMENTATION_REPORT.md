# IMP09_IMPLEMENTATION_REPORT

**Date:** 2026-07-15  
**Module:** Imp-09 Notifications / Realtime  
**Status:** PASS (awaiting human review)  
**Transport:** SSE (DR-IMP09-001)

---

## 1. Summary

Imp-09 delivers server→client push via `GET /events` (SSE). Domain events emit only after successful COMMIT from Imp-06 write paths and Imp-07 `notificationHooks`. Scoped delivery reuses worker/chef/admin ownership rules. No WebSocket, PG NOTIFY-to-client, Supabase Realtime, Outbox, or FE changes.

## 2. Decisions applied

| DR | Winner | Implementation |
|---|---|---|
| DR-IMP09-001 | SSE | `GET /events` `text/event-stream` |
| DR-IMP09-002 | Thaw Imp-06 minimal | `emitAfterPeriodMutation` after `withTransaction` returns |
| DR-IMP09-003 | Reuse Imp-07 hooks | `emitDomainEvent` / `emitReviewEvent` → dispatcher |

## 3. Code delivered

| Path | Role |
|---|---|
| `api-chantier/src/modules/realtime/` | SSE registry, serializer, scope, dispatcher, routes |
| `api-chantier/src/modules/timesheet/services/emitTimesheetEvents.js` | Post-COMMIT Imp-06 emits |
| `api-chantier/src/modules/timesheet/services/timesheetService.js` | Call emit after create/update/delete TX |
| `api-chantier/src/modules/validation/services/notificationHooks.js` | Shared bus + dispatcher attach |
| `api-chantier/src/modules/validation/services/reviewDecision.js` | Enrich hook payload with `userId`/`chantierId` |
| `api-chantier/src/app.js` | Mount `/events`, `initRealtime` |
| `api-chantier/test/realtime.test.js` | Imp-09 unit + SSE integration |

## 4. Behavior preserved

- Imp-05 / Imp-06 / Imp-07 / Imp-08 business logic unchanged (Imp-06: emit only after COMMIT).
- No schema migration.
- No FE edits.
- Rollback / failed writes do not emit.

## 5. Definition of Done checklist

| Criterion | Result |
|---|---|
| SSE endpoint works | ✓ |
| Scoped worker / chef / admin | ✓ |
| Imp-06 emit after COMMIT | ✓ |
| Imp-07 reuse notificationHooks | ✓ |
| Regression Imp01→Imp08 (+09) | ✓ 67/67 |
| No business logic invent | ✓ |
| Reports | ✓ |

## 6. Out of scope / follow-up

- Imp-12 FE adapter from Supabase `postgres_changes` → Unified `/events`.
- Event persistence / replay (explicitly not required).
- Polling backend (not used).
