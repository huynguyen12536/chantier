# IMP10_WAVE_B_IMPLEMENTATION_PLAN.md

**Date:** 2026-07-15  
**Status:** **SUPERSEDED** — Imp-10 **CLOSED** (`IMP10_FINAL_CLOSURE.md`). Retained as Wave B planning record.  
**Assumes:** Wave A CLOSED; in-process + ephemeral platform retained unless DRs reopen

---

## Sub-wave split inside Wave B

### Wave B0 — Investigation (THIS PACK)

| Field | Content |
|---|---|
| Purpose | Scope, matrix, DRs, plan |
| Code | **None** |
| Stop | Human reviews pack + answers `IMP10_WAVE_B_DECISION_LOG.md` |

### Wave B1 — Notification delivery reliability (recommended MVP)

| Field | Content |
|---|---|
| Purpose | Address G-03: failed in-process SSE write → enqueue redispatch |
| Business | None — delivery only |
| Jobs | **JB-01** `jobs.realtime.redispatch_catalog` |
| Invoke | Imp-09 `dispatchCatalogEvent(catalogEvent)` (or equivalent exported API) |
| Files (future) | `handlers/realtimeRedispatch.js`; register in registry; tests; **optional** tiny hook in Imp-09 dispatcher on `writeEvent` failure → `enqueueJob` |
| Dependencies | DR-B-001=A (or equiv), DR-B-002 if Imp-09 edited, DR-B-003=A (no SQL) |
| Risk | Duplicate frames to clients still connected; mitigate with idempotencyKey = `catalogEvent.id` / seq |
| Stop | Tests prove enqueue → dispatch; Imp-06/07 untouched; Imp-09 edit ≤ hook |
| Review gate | Human PASS before B2 |

### Wave B2 — Optional day resync repair (gated)

| Field | Content |
|---|---|
| Purpose | Ops repair for declaration projection (G-05) |
| Job | **JB-04** only if DR-B-004=A |
| Invoke | Imp-06 `syncDeclarationsFromPeriods` inside a controlled TX wrapper exported for jobs **or** existing service entry if available without inventing new business |
| Forbidden | Scheduled mass scan replacing Imp-06 TX sync |
| Stop | Explicit ops test + no FE; else **skip Wave B2 entirely** |

### Wave B3 — Explicitly not in Wave B

| Item | Lane |
|---|---|
| Durable Outbox / Last-Event-ID replay (JB-02/03) | New product Imp / reopen Imp-09 + DR-003 |
| Admin job HTTP API | Wave C |
| Worker process / Redis / Kafka | New topology DR |
| Imp-12 FE adapters | Imp-12 Wave B |

---

## Implementation sequence (after approval — not now)

1. Close DRs with Human letters.  
2. If B1 authorized: handler + tests (+ optional Imp-09 failure hook).  
3. Regression full suite.  
4. Reports; STOP.  
5. B2 only if DR-B-004 authorizes.

---

## Global stop rules

1. No coding in B0.  
2. No second write path for periods/declarations.  
3. No direct SQL.  
4. No FE.  
5. No replay buffer unless DR + evidence explicitly requires it.  
6. Jobs call services in-process only.
