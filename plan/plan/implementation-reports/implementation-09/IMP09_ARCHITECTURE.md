# IMP09_ARCHITECTURE

**Date:** 2026-07-15 (hardening update)  
**Transport:** Server-Sent Events (one-way server → client) — **unchanged**  
**Review:** APPROVED WITH MINOR COMMENTS → hardening docs + config only

---

## 1. Domain → SSE pipeline

```
Domain write (Imp-06 / Imp-07)
        ↓
  withTransaction COMMIT
        ↓
notificationHooks.emitDomainEvent / emitReviewEvent   ← producers
        ↓
realtime.dispatcher.expandToCatalogEvents
        ↓
realtime.dispatcher.dispatchCatalogEvent (scoped)
        ↓
sseRegistry → connected SSE clients                   ← subscribers (transport)
        ↓
Frontend (Imp-12 adapter later)
```

---

## 2. Connection lifecycle

```
Client GET /events
        ↓
Authenticate (Bearer preferred; ?access_token= fallback)
        ↓
Resolve scope (ouvrier / chef chantierIds / admin=all)
        ↓
Register in sseRegistry (addClient)
        ↓
Send `connected` (+ retry hint; echo Last-Event-ID, no replay)
        ↓
Heartbeat loop (SSE comment every SSE_HEARTBEAT_MS)
        ↓
Dispatch domain events → scoped writeEvent
        ↓
Client disconnect / req close / write error
        ↓
removeClient → res.end → if empty registry, stopHeartbeat
```

**Cleanup:** `removeClient` deletes registry entry, ends response, stops heartbeat timer when no clients remain. Failed writes also trigger `removeClient`.

---

## 3. SSE authentication (Security Note)

| Mechanism | Support | Prefer? |
|---|---|---|
| `Authorization: Bearer <jwt>` | Yes | **Yes** — default for fetch / Imp-12 |
| `?access_token=` or `?token=` | Yes | Fallback only |

**Why query fallback exists:** browser native `EventSource` cannot set custom headers. Imp-12 can use `fetch` + ReadableStream with Bearer and avoid query tokens.

**Risks of query token:** token may appear in access logs, proxy logs, Referer headers, browser history.

**Mitigations:** prefer Bearer whenever the client can set headers; short-lived JWT (`JWT_EXPIRES_IN`); do not log full query strings containing tokens in app logger; TLS required in production.

**No new auth invented** — same JWT verify as Imp-02.

---

## 4. Last-Event-ID (no replay)

| Behavior | Implementation |
|---|---|
| Header / `?lastEventId=` accepted | Yes |
| Echoed in `connected` payload as `lastEventId` | Yes |
| `lastEventIdReplay: false` | Explicit — server **ignores** ID for delivery |
| Persistence / missed-event buffer | **None** (by design) |
| Purpose | Client reconnect acknowledgment + future Imp-12 UX; not resume-from-offset |

---

## 5. SSE frame format

### Named event

```
id: <monotonic seq>
event: <catalog type e.g. period.created>
retry: <SSE_RETRY_MS>
data: {"type":"...","entityId":"...","userId":"...","chantierId":"...","statut":"...","actorId":"...","source":"...","at":"...","id":"<same as id>"}

```

### Heartbeat (comment — keeps proxies alive)

```
: heartbeat <epochMs>

```

### Ordering

- `id` is process-local monotonic sequence (`sseRegistry.nextEventId`).
- No cross-instance ordering guarantee; FE reloads full lists → idempotent.

---

## 6. Configuration

| Env | Default | Used for |
|---|---|---|
| `SSE_HEARTBEAT_MS` | `30000` | Heartbeat comment interval |
| `SSE_RETRY_MS` | `3000` | SSE `retry:` field on frames / `connected` |

Wired via `config/env.js` → `initRealtime()`. Not hard-coded in hot paths beyond env defaults.

---

## 7. Event ownership (precise)

| Event | Producer | Who emits to bus | Who fans out to SSE | Subscriber |
|---|---|---|---|---|
| `period.*` / `declaration.submitted|updated|approved` (write path) | Imp-06 | `emitAfterPeriodMutation` → `emitDomainEvent` | `dispatcher` | SSE clients in scope |
| `declaration.reviewed` / `period.reviewed` / `declaration.cancelled` | Imp-07 | `emitReviewEvent` after COMMIT | `dispatcher` (maps to catalog) | SSE clients in scope |
| `declaration.approved|rejected|cancelled` (catalog) | Mapped from Imp-07 hook types | — | `dispatcher.expandToCatalogEvents` | SSE clients |
| **`queue.changed`** | **Not Imp-06/07** | — | **`dispatcher` only** (`source: dispatcher.queue_changed`) after a primary period/declaration catalog event | Validation-oriented clients |
| **`dashboard.changed`** | **Not Imp-06/07** | — | **`dispatcher` only** (`source: dispatcher.dashboard_changed`) after a primary period/declaration catalog event | Chef-dashboard-oriented clients |

Imp-06/07 never call `emit*` for `queue.changed` / `dashboard.changed`. Those are **dispatcher secondary UI signals** synthesized from primary domain events so validation queue and chef dashboard can reload (FE contract: full reload on signal).

---

## 8. Scope rules

| Role | Delivery |
|---|---|
| `ouvrier` | `event.userId === self` |
| `chef_equipe` | `event.chantierId ∈ getChefChantierIds(self)` |
| `admin` / `administratif` | all |

---

## 9. Module layout

```
api-chantier/src/modules/realtime/
  eventTypes.js / eventBus.js / serializer.js
  sseRegistry.js / scope.js / dispatcher.js / routes.js / index.js
```

## 10. Non-goals (unchanged)

WebSocket · PG NOTIFY→client · Supabase Realtime · Outbox · replay persistence · FE edits · business rule invent
