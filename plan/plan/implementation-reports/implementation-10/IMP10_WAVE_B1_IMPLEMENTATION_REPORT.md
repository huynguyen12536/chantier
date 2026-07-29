# IMP10_WAVE_B1_IMPLEMENTATION_REPORT.md

**Date:** 2026-07-15  
**Module:** Imp-10 Background Jobs — **Wave B1**  
**Status:** **COMPLETE / CLOSED** — Human APPROVED; phase Imp-10 CLOSED  
**Mode:** Reliability job JB-01 only (DR seal locked)

---

## 1. Scope implemented

| Item | Delivered |
|---|---|
| JB-01 `jobs.realtime.redispatch_catalog` | Thin handler → Imp-09 `dispatchCatalogEvent` |
| Registry / jobTypes wiring | Builtin alongside `jobs.platform_noop` |
| DR-B-002 failure→enqueue hook | Minimal `else` branch in `dispatchCatalogEvent` when `writeEvent` fails |
| Jobs façade bind/unbind | `startJobs` / `stopJobs` inject enqueue API (no static circular import) |
| Storm control | Idempotency key `jobs.realtime.redispatch_catalog:${dispatchId}`; `_skipRedispatchEnqueue` on retry payload |
| Wave B2 (JB-04) | **Not implemented** (DR-B-004=B) |

---

## 2. DR seal used

```
DR-IMP10-B-001 = A
DR-IMP10-B-002 = A
DR-IMP10-B-003 = A
DR-IMP10-B-004 = B
DR-IMP10-B-005 = A
DR-IMP10-B-006 = B
```

Inherited Wave A (unchanged): `001=A, 002=A, 003=B, 004=A, 005=A, 006=A`.

---

## 3. Commits

| Milestone | SHA | Summary |
|---|---|---|
| M1 | `3159e5b3de` | JB-01 handler + registry + unit tests + Wave B investigation docs |
| M2 | `6d10aaf038` | SSE write-failure → enqueue JB-01 + M2 tests |
| M3 | `7f50d6ed46` | Wave B1 closure pack |

Code head for Wave B1 runtime: **`6d10aaf038`**.

---

## 4. Files created (runtime + tests)

| Path |
|---|
| `api-chantier/src/modules/jobs/handlers/realtimeRedispatch.js` |
| `api-chantier/test/jobs.waveB1.test.js` |
| `api-chantier/test/jobs.waveB1.m2.test.js` |

Investigation / design (M1 pack, previously delivered):

| Path |
|---|
| `IMP10_WAVE_B_SCOPE.md` |
| `IMP10_WAVE_B_CAPABILITY_MATRIX.md` |
| `IMP10_WAVE_B_IMPLEMENTATION_PLAN.md` |
| `IMP10_WAVE_B_DECISION_LOG.md` |
| `IMP10_WAVE_B_IMPLEMENTATION_SCOPE.md` |
| `IMP10_WAVE_B_DESIGN_REVIEW.md` |

---

## 5. Files modified (runtime)

| Path | Change |
|---|---|
| `api-chantier/src/modules/jobs/jobTypes.js` | `JOB_REALTIME_REDISPATCH_CATALOG` |
| `api-chantier/src/modules/jobs/registry.js` | Register JB-01 builtin |
| `api-chantier/src/modules/jobs/index.js` | Export type; bind/unbind enqueue API on start/stop |
| `api-chantier/src/modules/realtime/dispatcher.js` | Minimal write-failure → enqueue; bind helpers |

**Not modified:** timesheet, validation (business), users, compat, migrations, chantier1, Imp-09 routes/serializer/scope/sseRegistry (except via existing `writeEvent` return path).

---

## 6. Architecture confirmation

```
writeEvent fails
  → dispatcher.enqueueRedispatchOnWriteFailure (once per dispatchId)
  → jobs.enqueueJob(JB-01)
  → in-process runner (Wave A)
  → realtimeRedispatch.handler
  → dispatchCatalogEvent(catalogEvent with _skipRedispatchEnqueue)
```

- Ephemeral in-process queue preserved (DR-B-003=A, DR-B-005=A).  
- No second write path for periods/declarations.  
- Imp-09 remains SSE transport owner; Imp-10 owns only the thin job + enqueue bind.

---

## 7. Compatibility confirmation

| Surface | Status |
|---|---|
| Imp-12 Wave A adapters | Untouched |
| Frozen FE `chantier1/` | Untouched |
| SSE protocol / event catalog | Unchanged |
| Last-Event-ID / `lastEventIdReplay: false` | Preserved (DR-B-006=B) |
| Wave A job platform | Preserved (`platform_noop` still registered) |

---

## 8. Known limitations

- Ephemeral queue: restart loses queued redispatches.  
- Failed SSE client is removed; redispatch cannot deliver to that disconnected client.  
- Redispatch may fan-out again to clients that already received (duplicate SSE possible).  
- Best-effort delivery only — not durable missed-event recovery.

---

## 9. Explicitly deferred

| Item | Lane |
|---|---|
| Durable Outbox / Last-Event-ID replay | Product / Imp-09 reopen |
| Durable job persistence | Wave A DR-002 reopen / Imp-13 |
| JB-04 day resync | DR-B-004=B |
| Wave C DLQ / admin `/api/jobs` | Wave C |
| Imp-12 Wave B FE adapters | Imp-12 |

---

## 10. Forbidden items not implemented

No SQL, migrations, Redis, Kafka, Outbox, replay buffer, worker process, domain jobs, Imp-06/07 business edits, Imp-11/12 edits, FE changes, REST jobs API, internal HTTP self-calls.

---

## 11. Wave completion verdict

**Wave B1 implementation COMPLETE** under the locked DR seal.  
**Wave C DEFERRED.** Imp-12 Wave B unchanged / BLOCKED.
