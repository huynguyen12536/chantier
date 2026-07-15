# IMP10_RELEASE_NOTE.md

**Module:** Imp-10 — Background Jobs  
**Date:** 2026-07-15  
**Audience:** Engineering  
**Status:** COMPLETE / RELEASE APPROVED (known limitations)  
**Runtime head:** `6d10aaf038`

---

## What was implemented

1. **In-process job platform** (Wave A) inside `api-chantier`:
   - Registry, ephemeral memory queue, serial runner
   - Retry / backoff / failure policy
   - Idempotency through QUEUED + RUNNING
   - Builtin `jobs.platform_noop`
   - Lifecycle hooked from `server.js` (`startJobs` / `stopJobs`)
   - Config: `JOBS_ENABLED`, `JOBS_POLL_MS`, `JOBS_MAX_ATTEMPTS`, `JOBS_BACKOFF_CAP_MS`

2. **Reliability job JB-01** (Wave B1):
   - Type: `jobs.realtime.redispatch_catalog`
   - Thin adapter: calls Imp-09 `dispatchCatalogEvent` only
   - On SSE `writeEvent` failure, dispatcher enqueues JB-01 once per dispatch id
   - Retry payload sets `_skipRedispatchEnqueue` to prevent enqueue storms

3. **Tests:** Wave A jobs + Wave B1 M1/M2; full API suite green at close (105/105).

---

## Intentionally deferred

- Wave C — DLQ visibility, metrics hardening, optional admin job status API  
- Wave B2 / day-key resync jobs  
- Durable job queue, Redis, Kafka, Outbox  
- Last-Event-ID server-side replay  
- Separate worker processes  
- FE / Imp-12 Wave B adapters  
- Domain mutating jobs (Imp-06/07)

---

## Known limitations

- Queue is **ephemeral** — restart loses pending jobs  
- Redispatch is **best-effort**; disconnected clients are not revived  
- Redispatch may produce **duplicate SSE** frames for still-connected clients  
- Imp-09 **does not** replay on Last-Event-ID  
- No `/api/jobs` REST surface  

These match sealed DRs; they are accepted for this release.

---

## Future phases

| Next | Notes |
|---|---|
| Wave C | Only if Human authorizes ops hardening |
| Product durability decisions | Would reopen DR-002/004 and/or Imp-09 |
| Imp-12 Wave B | Separate blocked lane — not Imp-10 |
| Imp-13 | Production readiness for the platform as a whole |

---

## Ownership reminder

Jobs **invoke** Imp-09 (and must not duplicate Imp-06/07 business). Controllers/jobs do not create a second write path for periods/declarations.

**No further Imp-10 production work** without new Human authorization.
