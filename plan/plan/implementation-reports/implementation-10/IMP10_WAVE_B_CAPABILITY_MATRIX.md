# IMP10_WAVE_B_CAPABILITY_MATRIX.md

**Date:** 2026-07-15  
**Mode:** Investigation — no code  
**Rule:** Jobs invoke Imp-06/07/09 only; never fork business.

---

## A. Reliability gaps → job mapping

| Gap | Job candidate ID | Job proposes | Invokes | Belongs to | Need Wave B code? | Sub-wave |
|---|---|---|---|---|---|---|
| G-03 failed SSE write | **JB-01** `jobs.realtime.redispatch_catalog` | Re-run scoped catalog dispatch once/N times | Imp-09 `dispatchCatalogEvent` | Imp-10 handler; Imp-09 owns dispatch | **Yes if DR-B-001/002** | B1 |
| G-02 no Last-Event-ID replay | **JB-02** durable event buffer → SSE | Store events; replay on reconnect | Imp-09 SSE + store | Product/Imp-09 | **No** unless DR reopens 003 + invent buffer | DEFER / FORBIDDEN default |
| G-01 restart loses queue | **JB-03** durable job queue | Persist jobs | SQL/Redis | Imp-10 platform | **No** without reopen DR-002/004 | DEFER |
| G-05 sync drift repair | **JB-04** `jobs.timesheet.resync_day` | Call sync for (user, chantier, date) | Imp-06 `syncDeclarationsFromPeriods` | Imp-10 handler; Imp-06 owns sync | **Only if DR-B-004** | B2 optional |
| G-05 period propagation repair | **JB-05** `jobs.review.repropagate` | Call propagation after decision snapshot | Imp-06 `syncPeriodsFromDeclaration` or Imp-07 decide (prefer not) | High risk | **Defer / avoid** | — |
| — | **JB-06** `jobs.review.retry_emit` | Re-call `emitReviewEvent` | Imp-07 hooks → Imp-09 | Duplicate emit risk | **Defer** | — |
| Platform | Wave A `jobs.platform_noop` | Already done | — | Imp-10 | No | A CLOSED |

---

## B. Existing services inventory (may be invoked)

### Imp-06 Timesheet

| Export | Safe for job invoke? | Notes |
|---|---|---|
| `createPeriod` / `updatePeriod` / `deletePeriod` | Prefer **no** as background default | Mutating write path; actor/JWT context hard |
| `syncDeclarationsFromPeriods(client, …)` | Repair only | Requires DB client/TX; must not bypass actor policy blindly |
| `syncPeriodsFromDeclaration` | Repair only | Same |
| `emitAfterPeriodMutation` | Avoid double-emit | Already post-COMMIT from write path |
| `listPeriods` / `listDeclarations` | Read-only OK | Not reliability |

### Imp-07 Review

| Export | Safe for job invoke? | Notes |
|---|---|---|
| `approveDeclaration` / `reject` / `cancel` / `return` / `decidePeriod` | Prefer **no** as auto job | Needs actor; business transition — not reliability |
| `emitDomainEvent` / `emitReviewEvent` | Recovery only | Risk duplicate notifications |
| `listQueue` / history | Read-only OK | Not Wave B target |

### Imp-09 Realtime

| Export | Safe for job invoke? | Notes |
|---|---|---|
| `dispatchDomainEvent` / `dispatchCatalogEvent` | **Best Wave B target** | Fan-out already owned by Imp-09 |
| `expandToCatalogEvents` | Yes | Pure expansion |
| `writeEvent` / registry | Prefer via dispatcher | Don't invent parallel SSE path |
| `initRealtime` / routes | No rewrite | Frozen |

---

## C. Job ownership summary

| Job ID | Imp-10 owns | Business owner | Second write path risk |
|---|---|---|---|
| JB-01 redispatch | Handler + enqueue | Imp-09 delivery | **Low** (read/fan-out only) |
| JB-02 durable replay | Would co-own store | Imp-09 | Medium–High (invent buffer) |
| JB-03 durable queue | Platform persistence | Imp-10 | Medium (schema) |
| JB-04 resync day | Handler | Imp-06 sync | **High** if misused as cron rewrite of triggers |
| JB-05 repropagate | Handler | Imp-06/07 | **High** |
| JB-06 retry emit | Handler | Imp-07/09 | Medium (duplicates) |

---

## D. Dependencies

| Dependency | Status |
|---|---|
| Imp-10 Wave A platform | COMPLETE |
| Imp-06 / 07 / 09 modules | LOCKED COMPLETE |
| DR-IMP10-B-* answers | **Open** — block coding |
| Imp-12 Wave B | Independent / blocked — not required for JB-01 |

---

## E. Risk register (Wave B)

| Risk | Mitigation |
|---|---|
| Invent Outbox/SQL vs Imp-09 close | Default forbid; DR-B-003 |
| Double emit flood | Prefer redispatch of catalog payload once; dedupe by event id + idempotencyKey |
| Thaw Imp-09 without DR | DR-B-002 required for any dispatcher edit |
| Resync job becomes shadow sync path | Forbid scheduled mass resync; DR-B-004 ops-only |
| Actor-less domain writes | Forbid approve/createPeriod from jobs without explicit design |

---

## F. Recommended Wave B capability set (pre-DR)

**Recommended include:** JB-01 only (in-memory catalog redispatch), optional enqueue-on-SSE-failure hook.  

**Recommended exclude:** JB-02, JB-03, JB-05, JB-06 by default.  

**Optional gated:** JB-04 behind DR-B-004.
