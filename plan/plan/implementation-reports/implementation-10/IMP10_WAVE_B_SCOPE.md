# IMP10_WAVE_B_SCOPE.md

**Date:** 2026-07-15  
**Mode:** Design investigation only — **NO production code**  
**Prerequisite:** Imp-10 Wave A **COMPLETE / CLOSED** (`6a2a169bd1`, DRs 001–006 locked)  
**Authority for investigation:** Human Wave B design authorization  

---

## Mission (Wave B)

Deliver **reliability jobs** that **invoke existing Imp-06 / Imp-07 / Imp-09 services** — thin handlers on the Wave A platform — without duplicating business logic or creating a second write path.

Evidence baseline:

- WAVE2 Imp-10: jobs for approved domain events / reconciliation / notifications  
- `02_SINGLE_WRITE_PATH.md`: jobs **invoke** commands; do not write competing period/declaration state  
- Wave A closure: platform only; DR-003=B left Imp-09 no-replay gap open  
- Imp-09 FINAL: **no Outbox**, Last-Event-ID **no replay**

---

## Ownership

| Concern | Owner |
|---|---|
| Job runner / enqueue / retry policy | Imp-10 (Wave A) |
| Period / declaration sync business | Imp-06 — **LOCKED** |
| Review transitions / audit | Imp-07 — **LOCKED** |
| SSE transport / catalog / scope | Imp-09 — **LOCKED** (thaw only if DR allows minimal hook) |
| Wave B job **handlers** (thin invoke) | Imp-10 |
| FE adapters | Imp-12 (out of Wave B) |

---

## Reliability gaps remaining after Wave A

| Gap ID | Gap | Evidence | Severity | Wave B candidate? |
|---|---|---|---|---|
| G-01 | Queued/running jobs lost on process restart | DR-002=A ephemeral | Ops | Only if durable queue reopened (new DR; conflicts Wave A seal without reopen) |
| G-02 | Imp-09 Last-Event-ID no server replay / no buffer | Imp-09 FINAL; DR-003=B | Product realtime | **Only if** new DR reopens DR-003 |
| G-03 | SSE `writeEvent` may fail for a client; no retry of catalog dispatch | Imp-09 dispatcher/registry | Medium | **Yes** — in-memory redispatch job invoking Imp-09 `dispatchCatalogEvent` |
| G-04 | Completed idempotency key Set grows until process exit | Wave A queue | Low | Wave C / ops |
| G-05 | No automated repair if TX sync somehow drifted | Sync is in-TX today; no CVL “job” evidence | Speculative | **Risky** — day resync via Imp-06 service only if DR + ops evidence |
| G-06 | No FE socket → Unified cutover reliability | Imp-12 Wave B blocked | Out of Imp-10 | Imp-12 |

---

## IN — Wave B (subject to DRs)

| Item | Notes |
|---|---|
| Thin job handlers under `modules/jobs/handlers/` | Call Imp-06/07/09 **exported** service/dispatcher APIs only |
| Register new job types on Wave A registry | Additive |
| Optional minimal Imp-09 **enqueue hook** after failed SSE write | Requires DR-IMP10-B-002 thaw; no transport rewrite |
| Compat/regression tests for handlers | Invoke services; assert no business fork |
| Wave B docs / reports after coding | Separate from this investigation |

---

## OUT / FORBIDDEN

| Forbidden | Why |
|---|---|
| Duplicate DeclarationSync / ReviewDecision logic inside jobs | Ownership + single write path |
| Direct SQL / migrations for Outbox (unless new DR reopens 004) | Wave A DR-004=A; Imp-09 no Outbox |
| Replay buffer inventing missed events for reconnecting clients | User rule + Imp-09 design; needs explicit evidence + DR |
| Redis / Kafka / separate worker (unless justified + DR) | Wave A DR-001=A; no SoT broker |
| FE changes / Imp-12 Wave B | Separate track |
| Imp-11 business / Super Admin | Out of scope |
| Porting CVL SQL triggers as cron sync | Imp-10 acceptance forbids unmapped trigger ports |
| Internal HTTP `fetch('/api/...')` to own services | In-process invoke only (Wave A pattern) |

---

## REUSE

| Module | Invocable surfaces (evidence) |
|---|---|
| Imp-06 | `timesheetService.*`, `declarationSync.syncDeclarationsFromPeriods`, `periodPropagation.syncPeriodsFromDeclaration`, `emitAfterPeriodMutation` (emit already post-COMMIT — do not double-emit casually) |
| Imp-07 | `reviewDecision.approve/reject/return/cancel/decidePeriod`, `notificationHooks.emit*` (prefer not re-emit unless recovery) |
| Imp-09 | `dispatchDomainEvent`, `dispatchCatalogEvent`, `expandToCatalogEvents`, `sseRegistry` (read-only prefer) |
| Imp-10 Wave A | `enqueueJob`, registry, runner, policies |

---

## DEFERRED

| Item | Lane |
|---|---|
| Durable job/outbox tables | New DR (reopen 002/004) or Imp-13 |
| Full SSE history replay | Product + Imp-09 thaw — not default Wave B |
| Day-key mass resync cron | DR-IMP10-B-004 |
| Admin `/api/jobs` | Wave C / DR-006 reopen |
| Imp-12 FE realtime adapter | Imp-12 Wave B |

---

## Coding now?

**NO.** Investigation only. Coding blocked until Wave B DRs answered + Human design review approval.
