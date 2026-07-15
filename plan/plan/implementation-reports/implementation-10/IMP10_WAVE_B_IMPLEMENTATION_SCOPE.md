# IMP10_WAVE_B_IMPLEMENTATION_SCOPE.md

**Date:** 2026-07-15  
**Mode:** Investigation — describes **future** code boundaries if DRs approve  

---

## What production code WILL eventually be written (if DRs approve)

Illustrative — **not authorized now**:

| Area | Nature |
|---|---|
| `handlers/realtimeRedispatch.js` (name TBD) | Thin handler: accept catalog event payload → call Imp-09 `dispatchCatalogEvent` |
| Registry registration | Register `jobs.realtime.redispatch_catalog` (or final type string) |
| Tests | Idempotent redispatch; no Imp-06/07 rewrite |
| Optional Imp-09 hook | On SSE write failure → `enqueueJob({ type, payload, idempotencyKey })` |
| Docs | Wave B implementation / test / regression reports |

Only if DR-B-004=A (not recommended):

| Area | Nature |
|---|---|
| `handlers/timesheetResyncDay.js` | Call Imp-06 sync API with explicit day key; strict guards |

---

## What production code is EXPLICITLY FORBIDDEN

| Forbidden | Why |
|---|---|
| Copy of `declarationSync` / `reviewDecision` business into jobs | Ownership / single write path |
| Direct SQL / new migrations (default) | DR-B-003 recommended A; Wave A 004 |
| Redis / Kafka / Outbox tables invent | No evidence; Imp-09 closed without Outbox |
| Last-Event-ID replay buffer (default) | DR-B-006 recommended B; user rule |
| Separate worker process (default) | DR-B-005 recommended A |
| FE edits / Imp-12 Wave B | Wrong phase |
| Scheduled mass resync cron as trigger replacement | Imp-10 acceptance |
| `createPeriod` / `approveDeclaration` as silent background automations without actor design | Business ownership |
| Internal HTTP self-calls | In-process only |
| Modifying Imp-06/07 business files | LOCKED — invoke only |
| Broad Imp-09 transport rewrite | LOCKED — optional failure hook only if DR-B-002=A |

---

## Modules reused vs untouched

| Module | Wave B stance |
|---|---|
| Imp-10 Wave A runner/queue | REUSE (extend handlers/registry only) |
| Imp-09 dispatcher | REUSE invoke; optional minimal thaw |
| Imp-06 / Imp-07 | REUSE invoke **only if** DR-B-004; else untouched |
| Imp-11 / Imp-12 / FE / migrations | UNTOUCHED |

---

## Production code now?

**NO.**

```
Imp-10 Wave B investigation only.
Coding remains blocked until Human approves Wave B DRs + design review.
```
