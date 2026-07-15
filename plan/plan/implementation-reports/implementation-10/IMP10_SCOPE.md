# IMP10_SCOPE.md

**Date:** 2026-07-15  
**Module:** Imp-10 — Background Jobs  
**Status:** Investigation sealed — no implementation  
**Roadmap:** `plan/plan/WAVE2_IMPLEMENTATION_ROADMAP.md` § Imp-10  
**Depends On (roadmap):** Imp-06, Imp-07, Imp-09 — **all COMPLETE**

---

## Mission

Implement **reliable asynchronous processing** required by approved **domain events**, **reconciliation**, or **notifications**.

Evidence quote (roadmap):

> Goal: Implement reliable asynchronous processing required by approved domain events, reconciliation, or notifications.  
> Acceptance: Each job has an evidence-backed purpose, idempotency/retry/failure policy, observability, and integration tests; **no legacy trigger is ported without a mapped service/event path.**

Unified single-write-path rule (`migration-analysis/unified/logic/02_SINGLE_WRITE_PATH.md`):

> Controllers, **jobs**, notifications, and future legacy adapters **invoke these commands**; they do not write competing period/declaration state directly.

Therefore Imp-10 is an **execution reliability layer**, not a new business domain.

---

## Ownership / category

| Dimension | Value |
|---|---|
| Category | Platform / reliability (async job runner) |
| Owns | Job enqueue/execute policies, retry/idempotency/DLQ, observability for jobs |
| Does **not** own | Timesheet sync rules, review transitions, SSE transport, auth, admin, FE adapters |
| Invokes | Existing Imp-06 / Imp-07 / Imp-09 surfaces (and later only via DR) |

---

## Responsibilities (IN — evidence-backed intent)

| Responsibility | Evidence |
|---|---|
| Async job platform for approved work | WAVE2 Imp-10 goal + DoD |
| Jobs that **call** existing domain commands/services | `02_SINGLE_WRITE_PATH.md` |
| Idempotency / retry / failure policy per job | Imp-10 acceptance criteria |
| Observability (logs, correlation) for job runs | Imp-10 acceptance; Imp-01 correlation |
| Notify/reconcile reliability **only where DR proves a gap** after Imp-09 in-process emit | Imp-09: no replay buffer; Imp-07 noted “mechanism later” for outbox |

---

## OUT — not Imp-10 business

| Item | Owner |
|---|---|
| Period ↔ declaration sync (CVL triggers) | **Already** Imp-06 `DeclarationSyncService` (in-TX) |
| Declaration → period propagation | **Already** Imp-07 / Imp-06 period propagation (in-TX) |
| Auto-approve matching shift | **Already** Imp-06/07 policy path |
| SSE transport / `/events` | Imp-09 CLOSED |
| Edge/RPC/table FE aliases | Imp-12 (Wave A done; Wave B blocked) |
| Administration PATCH/role | Imp-11 LOCKED |
| Auth / JWT | Imp-02 LOCKED |
| Users create/delete | Imp-03 |
| Chantiers / cascade | Imp-04 |
| Affectations / zones | Imp-05 |
| Export/payroll | Imp-08 |
| ETL / cutover / production readiness | Imp-13 / Phase 11–14 |
| Super Admin / multi-company / Storage | Decision Log deferred / N/A |
| Porting SQL triggers as job scripts that write domain rows | Forbidden (acceptance + single write path) |

---

## FORBIDDEN

| Forbidden | Why |
|---|---|
| Rewrite Imp-02…Imp-09 / Imp-11 / Imp-12 Wave A business | Ownership lock |
| Re-implement CVL triggers as background “sync jobs” that bypass Imp-06/07 TX | Acceptance + `02_SINGLE_WRITE_PATH` |
| Competing second write path for periods/declarations | Unified design |
| Invent jobs without evidence-backed purpose | WAVE2 + “Never invent behavior” |
| Invent Outbox/queue **tables** without DR (Imp-09: no CVL notif/outbox tables) | Imp-09 investigation + DB policy |
| FE modifications under `chantier1/` | Freeze |
| Imp-12 Wave B without new auth | Imp-12 review |
| SQL rewrite of old migrations | Wave policy |
| Auth/session GoTrue clone | Imp-12 DR-004 = B |

---

## REUSE

| Imp | Reuse how |
|---|---|
| Imp-01 | Logger, correlation ID, health, env, pool |
| Imp-02 | JWT identity if a secured job admin endpoint is later approved (not invent) |
| Imp-06 | Call timesheet/sync services **only** if a job must re-enter domain commands |
| Imp-07 | Call review commands / use existing hooks patterns — do not fork review |
| Imp-09 | Consume dispatcher/catalog events for **delivery reliability** only if DR allows; do not rewrite SSE |
| Imp-11 / Imp-12 | Untouched unless a job needs to call their services (unlikely in Wave A) |

---

## DEFERRED

| Item | Gate |
|---|---|
| Durable miss-event replay for SSE | **DR-IMP10-*** + possibly reopen product vs Imp-09 closed “no outbox” |
| Separate worker process vs in-process runner | DR |
| Job persistence schema | DR + DATABASE_EVOLUTION_POLICY |
| Scheduled cron-style domain jobs | Needs evidence of purpose (none in FE inventory today) |
| Imp-12 Wave B | Separate authorization |
| Phase 11 ETL jobs | Imp-13 lane — not Imp-10 domain |

---

## Current reality (post Imp-06/07/09)

| Mechanism | Today | Imp-10 implication |
|---|---|---|
| Trigger sync → service | Imp-06/07 **synchronous TX** | Do **not** move sync into jobs as default |
| Domain → SSE | Imp-09 **post-COMMIT in-process** emit | Jobs only if reliability gap is authorized |
| Last-Event-ID | Echo, **no replay** | Reliability gap exists; closing it is a DR, not automatic Imp-10 scope |
| Job runner in `api-chantier` | **Absent** | Candidate Wave A platform work **after** DRs |

---

## Coding now?

**NO.** Investigation only. Coding blocked until Human closes DRs and authorizes a wave.
