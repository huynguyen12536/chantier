# IMP09_TRACEABILITY

**Date:** 2026-07-15 (hardening)

---

## 1. Decision → code (unchanged winners)

| Decision | Evidence |
|---|---|
| DR-IMP09-001 SSE | `realtime/routes.js` `GET /`, `app.js` `/events` |
| DR-IMP09-002 Imp-06 post-COMMIT | `emitTimesheetEvents.js` + `timesheetService` after `withTransaction` |
| DR-IMP09-003 Reuse Imp-07 hooks | `notificationHooks.emitDomainEvent` → `dispatchDomainEvent` |

## 2. Review hardening → evidence

| Review item | Evidence |
|---|---|
| Auth Bearer preferred + query fallback + Security Note | `auth.js` `extractBearerToken`; `IMP09_ARCHITECTURE.md` §3 |
| Last-Event-ID no replay | `routes.js` comments + `lastEventIdReplay: false`; Architecture §4 |
| SSE frame format | Architecture §5; `serializer.js` |
| `queue.changed` / `dashboard.changed` ownership | Architecture §7; `dispatcher.js` `source: dispatcher.queue_changed` / `dispatcher.dashboard_changed` |
| Config not hard-coded | `env.sseHeartbeatMs` / `env.sseRetryMs`; `.env.example` |
| Connection lifecycle | Architecture §2 |

## 3. FE contract → backend signal

| FE screen | Unified signal |
|---|---|
| timesheet | scoped `period.*` / `declaration.*` |
| validation | `queue.changed` + declaration catalog |
| chef-dashboard | `dashboard.changed` + period catalog in chef scope |

## 4. Producer chain

```
Imp-06 emitAfterPeriodMutation / Imp-07 emitReviewEvent
  → notificationHooks (bus)
  → dispatcher.expandToCatalogEvents
  → dispatchCatalogEvent + scope gate
  → sseRegistry.writeEvent
```

Secondary UI signals (`queue.changed`, `dashboard.changed`): **created only inside dispatcher**, never by Imp-06/07 services.
