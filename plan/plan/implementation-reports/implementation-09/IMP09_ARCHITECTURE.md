# IMP09_ARCHITECTURE

**Date:** 2026-07-15  
**Transport:** Server-Sent Events (one-way server → client)

---

## 1. Pipeline

```
Domain write (Imp-06 / Imp-07)
        ↓
  withTransaction COMMIT
        ↓
notificationHooks.emitDomainEvent / emitReviewEvent
        ↓
realtime.dispatcher.expandToCatalogEvents
        ↓
realtime.dispatcher.dispatchCatalogEvent (scoped)
        ↓
sseRegistry → connected SSE clients
        ↓
Frontend (Imp-12 adapter later)
```

## 2. Module layout

```
api-chantier/src/modules/realtime/
  eventTypes.js      — catalog types
  eventBus.js        — façade re-export
  serializer.js      — SSE wire format + heartbeat comments
  sseRegistry.js     — connect / disconnect / heartbeat / write
  scope.js           — worker / chef / admin delivery gate
  dispatcher.js      — expand + fan-out
  routes.js          — GET /events
  index.js           — init / exports
```

## 3. Endpoint

| Item | Value |
|---|---|
| Path | `GET /events` |
| Content-Type | `text/event-stream; charset=utf-8` |
| Auth | Bearer JWT or `?access_token=` (EventSource-friendly) |
| Reconnect | `Last-Event-ID` accepted; **no** server persistence/replay |
| Heartbeat | SSE comment `: heartbeat …` every 30s (configurable) |
| Retry hint | `retry: 3000` |

## 4. Scope rules (reuse Imp-05/06/07)

| Role | Delivery |
|---|---|
| `ouvrier` | `event.userId === self` |
| `chef_equipe` | `event.chantierId ∈ getChefChantierIds(self)` |
| `admin` / `administratif` | all events |

No system-wide broadcast to all connected roles.

## 5. Event catalog

| Type | Producers |
|---|---|
| `period.created` / `.updated` / `.deleted` | Imp-06 after COMMIT |
| `declaration.submitted` / `.updated` / `.approved` | Imp-06 sync / auto-approve |
| `declaration.approved` / `.rejected` / `.cancelled` | Imp-07 hooks (mapped from review types) |
| `queue.changed` / `dashboard.changed` | Derived in dispatcher |

Imp-07 still emits `declaration.reviewed` / `period.reviewed` / `declaration.cancelled`; dispatcher maps to catalog.

## 6. Non-goals

- WebSocket, PG NOTIFY to clients, Supabase Realtime, Outbox
- Client → server realtime channel
- Ordered exactly-once persistence
- Changing review/timesheet business rules
