# IMP10_WAVE_A_IMPLEMENTATION_PLAN.md

**Date:** 2026-07-15  
**Status:** FINAL SPEC — awaiting Human approval of **this document** before coding  
**Human design review:** APPROVED  

**DR seal (LOCKED):**

```
DR-IMP10-001 = A   # in-process runner (same Node process)
DR-IMP10-002 = A   # ephemeral in-memory queue
DR-IMP10-003 = B   # do not close Imp-09 replay/buffer gap
DR-IMP10-004 = A   # no SQL
DR-IMP10-005 = A   # platform noop job only
DR-IMP10-006 = A   # no FE / HTTP job APIs
```

**Wave A product scope (only):**

In-process job platform = runner + registry + policies + queue + noop/health job + observability + tests.

---

## Explicit confirmations (NON-NEGOTIABLE)

| Constraint | Wave A |
|---|---|
| NO SQL migrations | **Confirmed** |
| NO new REST endpoints | **Confirmed** |
| NO FE changes (`chantier1/`) | **Confirmed** |
| NO Imp-06 business modifications | **Confirmed** |
| NO Imp-07 business modifications | **Confirmed** |
| NO Imp-09 business / SSE / dispatcher modifications | **Confirmed** |
| NO Imp-11 modifications | **Confirmed** |
| NO Imp-12 modifications (Wave A locked; Wave B blocked) | **Confirmed** |
| NO notification jobs | **Confirmed** (DR-003=B, DR-005=A) |
| NO domain jobs (timesheet/review/export/admin) | **Confirmed** |
| NO replay buffer | **Confirmed** |
| NO outbox | **Confirmed** |
| NO separate worker process | **Confirmed** (DR-001=A) |
| NO Redis | **Confirmed** |
| NO Kafka / external broker | **Confirmed** |

---

## 1. Exact files that will be created

| Path | Role |
|---|---|
| `api-chantier/src/modules/jobs/jobTypes.js` | Job type constants |
| `api-chantier/src/modules/jobs/policies.js` | Retry + idempotency pure helpers |
| `api-chantier/src/modules/jobs/correlation.js` | Job correlation id helper |
| `api-chantier/src/modules/jobs/registry.js` | Job type → handler map |
| `api-chantier/src/modules/jobs/queue.js` | Ephemeral FIFO + idempotency bookkeeping |
| `api-chantier/src/modules/jobs/runner.js` | Serial execute loop |
| `api-chantier/src/modules/jobs/handlers/platformNoop.js` | Only Wave A handler |
| `api-chantier/src/modules/jobs/index.js` | Public façade (`startJobs` / `stopJobs` / `enqueueJob` / status) |
| `api-chantier/test/jobs.waveA.test.js` | Platform tests |
| `plan/plan/implementation-reports/implementation-10/IMP10_IMPLEMENTATION_REPORT.md` | Post-code delivery report |
| `plan/plan/implementation-reports/implementation-10/IMP10_TEST_REPORT.md` | Post-code test report |
| `plan/plan/implementation-reports/implementation-10/IMP10_REGRESSION_REPORT.md` | Post-code regression report |
| `plan/plan/implementation-reports/implementation-10/IMP10_WAVE_A_REVIEW.md` | Placeholder for Human review after coding |

---

## 2. Exact existing files that will be modified

| Path | Allowed change only |
|---|---|
| `api-chantier/src/server.js` | Call `startJobs()` after listen; `stopJobs()` in shutdown before `closePool` |
| `api-chantier/src/config/env.js` | Additive optional `JOBS_*` keys only |
| `api-chantier/.env.example` | Document optional `JOBS_*` (if file exists) |
| `api-chantier/README.md` | Note Imp-10 jobs = internal platform, not primary API |
| `plan/plan/implementation-reports/implementation-10/IMP10_DECISION_LOG.md` | Mark seal FINAL (docs) |
| `plan/plan/implementation-reports/implementation-10/IMP10_INVESTIGATION_INDEX.md` | Link this approved plan |
| `plan/plan/tracking/decision_log.md` | Row: Wave A coding authorized / delivered |

**Must not modify:** `app.js` (no routes), any `modules/{auth,users,chantiers,affectations,zones,timesheet,validation,export,realtime,compat}/**`, `migrations/**`, `chantier1/**`.

---

## 3. Responsibilities of every file

### Created

#### `jobTypes.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Single source of job type strings |
| Why needed | Prevents magic strings; enforces allow-list |
| Dependencies | none |
| Must NOT | Register handlers; enqueue; import domain modules |

#### `policies.js`

| | |
|---|---|
| Action | **create** |
| Purpose | `computeBackoffMs`, `shouldRetry`, `normalizeIdempotencyKey`, default max attempts |
| Why needed | WAVE2 Imp-10 DoD: idempotency/retry/failure policy |
| Dependencies | `config/env.js` (optional reads) |
| Must NOT | Touch DB; call Imp-06/07/09; invent DLQ persistence |

#### `correlation.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Create/reuse a correlation id for each job |
| Why needed | Imp-01 observability parity for non-HTTP work |
| Dependencies | `node:crypto` |
| Must NOT | Depend on Express `req`; invent distributed tracing stack |

#### `registry.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Map `jobType` → `{ handler, maxAttempts? }` |
| Why needed | Only registered types may run (Wave A: noop only) |
| Dependencies | `handlers/platformNoop.js`, `jobTypes.js` |
| Must NOT | Auto-register domain/notification types; execute jobs |

#### `queue.js`

| | |
|---|---|
| Action | **create** |
| Purpose | In-memory FIFO; pending + completed idempotency keys; dead list (memory) |
| Why needed | DR-002=A ephemeral persistence |
| Dependencies | `policies.js`, `node:crypto` (job ids) |
| Must NOT | Write SQL/files/Redis; survive restart by design |

#### `runner.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Serial loop: dequeue → execute → complete / retry / fail |
| Why needed | DR-001=A in-process execution |
| Dependencies | registry, queue, policies, correlation, logger, env |
| Must NOT | Parallel workers; HTTP; domain imports; continue after `stop` |

#### `handlers/platformNoop.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Side-effect-free handler that proves the platform |
| Why needed | DR-005=A — only allowed production job |
| Dependencies | logger, `jobTypes.js` |
| Must NOT | Call timesheet/review/realtime/compat; write DB; emit SSE |

#### `index.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Stable public API for `server.js` and tests |
| Why needed | Single integration point |
| Dependencies | runner, registry, queue, jobTypes |
| Must NOT | Mount Express routes; import locked Imp modules |

#### `test/jobs.waveA.test.js`

| | |
|---|---|
| Action | **create** |
| Purpose | Prove enqueue, idempotency, retry, stop, unknown-type reject |
| Why needed | Imp-10 acceptance + Wave A DoD |
| Dependencies | jobs module (and test helpers); may use `createApp` only if needed for unrelated regression — prefer direct module tests |
| Must NOT | Require Imp-06/07/09 side effects; invent notification job tests |

### Modified

#### `server.js`

| | |
|---|---|
| Action | **modify** |
| Purpose | Tie runner lifecycle to process lifecycle |
| Why needed | DR-001=A — runner lives in API process |
| Dependencies | `./modules/jobs/index.js` |
| Must NOT | Change auth/DB/business boot beyond jobs start/stop |

#### `config/env.js`

| | |
|---|---|
| Action | **modify** (additive) |
| Purpose | Optional `JOBS_ENABLED`, `JOBS_POLL_MS`, `JOBS_MAX_ATTEMPTS`, `JOBS_BACKOFF_CAP_MS` |
| Why needed | Tunable poll/retry without code edits |
| Dependencies | existing env pattern |
| Must NOT | Remove/rename existing env keys; add broker URLs |

#### `.env.example` / `README.md`

| | |
|---|---|
| Action | **modify** (docs) |
| Purpose | Document internal jobs platform |
| Must NOT | Document fake REST `/api/jobs` as supported FE API |

---

## 4. Module architecture

```
                    ┌─────────────────────────┐
                    │  server.js (lifecycle)  │
                    └───────────┬─────────────┘
                                │ startJobs / stopJobs
                    ┌───────────▼─────────────┐
                    │   modules/jobs/index.js │
                    └─┬─────────┬───────────┬─┘
                      │         │           │
           ┌──────────▼──┐  ┌───▼────┐  ┌───▼────┐
           │  registry   │  │ queue  │  │ runner │
           └──────┬──────┘  └───▲────┘  └───┬────┘
                  │             │           │
           ┌──────▼──────┐      │    execute│+retry
           │ platformNoop│      └───────────┘
           └─────────────┘
                  ▲
           policies + correlation + logger (Imp-01)
```

- **No** routes / controllers / repositories / SQL.
- Domain modules are **not** on the import graph in Wave A.
- Future Wave B handlers (if ever authorized) would call existing **services** only — out of Wave A.

---

## 5. Startup lifecycle

```
process start
  → env load
  → createApp()   [unchanged mounts; no /api/jobs]
  → pingDatabase (existing)
  → server.listen
  → if JOBS_ENABLED (default true):
       startJobs()
         → registerBuiltinJobs()   // only jobs.platform_noop
         → startRunner()           // serial poll loop
  → accepting HTTP + background ticks

SIGINT / SIGTERM
  → stopJobs()          // clear timer; running=false
  → server.close()
  → closePool()
  → exit
```

Tests that do not boot `server.js` call `startJobs`/`stopJobs` or `runOnce` explicitly.

---

## 6. Job lifecycle

```
enqueueJob({ type, payload, idempotencyKey, correlationId? })
  → validate type ∈ registry
  → normalize idempotencyKey (reject empty)
  → if key already completed OR pending → return { accepted:true, duplicate:true }
  → create job { id, type, payload, attempt:0, correlationId, enqueuedAt }
  → push FIFO
  → log jobs.enqueued
  → return { accepted:true, duplicate:false, jobId }

runner tick
  → dequeue one job (serial)
  → log jobs.start
  → await handler(...)
  → success:
       markCompleted(key)
       log jobs.completed
  → failure:
       if shouldRetry(attempt):
         attempt++
         delay = backoff(attempt)
         log jobs.retry
         wait delay
         re-enqueue tail
       else:
         markDead(job)
         log jobs.failed
```

**Only registered type in Wave A:** `jobs.platform_noop`.

---

## 7. Queue lifecycle

| State | Meaning |
|---|---|
| pending | FIFO array of jobs |
| inFlight | optional single job id while executing (serial) |
| completedKeys | Set of idempotency keys successfully finished |
| dead | Array of exhausted jobs (memory only; for status/tests) |

| Event | Effect |
|---|---|
| process restart | **All state lost** (DR-002=A) — by design |
| `clear()` | Test helper only |
| `snapshot()` / `getJobsStatus()` | Counts for tests/logs — **not** HTTP |

No disk, no DB, no Redis.

---

## 8. Retry policy

| Parameter | Default | Env override |
|---|---|---|
| Max attempts | `3` | `JOBS_MAX_ATTEMPTS` |
| Backoff | `100 * 2^(attempt-1)` ms | — |
| Backoff cap | `2000` ms | `JOBS_BACKOFF_CAP_MS` |
| Poll idle | `50–100` ms | `JOBS_POLL_MS` |

| Rule | Behavior |
|---|---|
| Retryable failure | Any thrown error from Wave A noop unless marked `nonRetryable: true` |
| Exhaustion | `jobs.failed`; job → dead list; no further retries |
| Concurrency | **Serial** — one execution at a time |
| Jitter | Not required Wave A (keep deterministic for tests) |

---

## 9. Idempotency mechanism

| Rule | Behavior |
|---|---|
| Required field | `idempotencyKey` non-empty string on every enqueue |
| Pending duplicate | Same key already in queue or in-flight → no second enqueue |
| Completed duplicate | Same key in `completedKeys` → no re-run |
| Key format | Opaque string; normalize trim; reject empty |
| Persistence | Process memory only |
| Handler requirement | `platform_noop` must be side-effect-free (safe if memory cleared) |

---

## 10. Logging & correlation flow

```
enqueue / execute
  → correlationId = provided OR createJobCorrelationId()
  → logger.* meta ALWAYS includes:
       correlationId, jobId, type, attempt, idempotencyKey
```

| Message | Level |
|---|---|
| `jobs.runner.started` / `jobs.runner.stopped` | info |
| `jobs.enqueued` | info |
| `jobs.start` | info |
| `jobs.completed` | info (+ `durationMs`) |
| `jobs.retry` | warn |
| `jobs.failed` | error |
| `jobs.platform_noop.tick` | info (handler) |

Reuse Imp-01 `shared/utils/logger.js`. Do not add external APM.

HTTP `x-correlation-id` middleware does **not** wrap jobs; jobs carry their own id (may copy from caller if enqueue supplies it).

---

## 11. Test strategy

File: `test/jobs.waveA.test.js`

| # | Case | Assert |
|---|---|---|
| 1 | Enqueue + run noop | completes; completedKeys has key |
| 2 | Duplicate idempotency key | `duplicate: true`; handler once |
| 3 | Retry then success | test-only flaky handler registered temporarily OR mock; succeeds ≤ max attempts |
| 4 | Exhaust retries | dead list; no infinite loop |
| 5 | Unknown type | rejected / throws |
| 6 | Empty idempotency key | rejected |
| 7 | `stopJobs` | loop stops; no runaway timers |
| 8 | `JOBS_ENABLED=false` (optional) | runner does not start when configured |

Prefer unit-style tests against `modules/jobs` without needing Postgres unless using shared harness that already migrates.

---

## 12. Regression scope

| Suite | Expectation |
|---|---|
| All `api-chantier/test/**/*.test.js` | PASS (prior ~80 + new jobs tests) |
| Imp-06 / 07 / 09 / 11 / 12 Wave A | Unchanged behavior |
| FE | Not in suite; must remain untouched |

Command: `node --test --test-concurrency=1 test/**/*.test.js`

---

## 13. Rollback strategy

| Scenario | Action |
|---|---|
| Wave A commit unhealthy | `git revert` Wave A commit(s); no migration to reverse |
| Partial deploy | Set `JOBS_ENABLED=false` to disable runner without removing code |
| Runtime leak | `stopJobs` on shutdown; fix timer clear; revert if needed |

Because queue is ephemeral, rollback never requires DB restore for Imp-10 Wave A.

---

## 14. Stop conditions

Stop coding / do not merge if any of:

1. Temptation to add SQL, Redis, worker process, or Outbox  
2. Any edit under Imp-06/07/09/11/12 or `chantier1/`  
3. Any new Express route for jobs  
4. Any notification or domain job type registered  
5. Replay buffer or Last-Event-ID resume logic  
6. Tests red or regression fails  
7. Wave B Imp-12 or Imp-10 Wave B scope creep  

After green delivery: **commit, push, STOP** — await Human Wave A review. Do **not** start Wave B.

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| Platform unused until Wave B | Accepted — Wave A proves DoD only |
| Jobs lost on restart | By design DR-002=A; document clearly |
| Timer leaks in tests | Always `stopJobs` in `after` |
| Accidental domain imports | Code review gate; lint awareness; this plan forbid list |
| Dual queue invention later | Keep single `queue.js`; no second store |
| Serial runner lag if future heavy jobs | Out of Wave A; revisit only with new DR |

---

## 16. PASS criteria

Wave A **PASS** only if all true:

1. All created/modified files match this plan (no extras)  
2. Runner starts/stops with server when enabled  
3. Only `jobs.platform_noop` is registered  
4. Idempotency + retry proven by tests  
5. Structured logs include correlationId on job events  
6. Full regression suite green  
7. Confirmations table at top still held (no SQL/REST/FE/domain/notif/outbox/worker/broker)  
8. Reports written (`IMPLEMENTATION` / `TEST` / `REGRESSION`)  
9. Delivery pushed; **STOP** for Human review  

---

## Implementation sequence (commits)

### Commit 1 — Core platform (no server wiring)

- Create: `jobTypes.js`, `policies.js`, `correlation.js`, `registry.js`, `queue.js`, `runner.js`, `handlers/platformNoop.js`, `index.js`
- Create: `test/jobs.waveA.test.js` (unit tests via `runOnce` / start-stop without requiring full HTTP if possible)
- Modify: `config/env.js` (+ `.env.example` if present) additive `JOBS_*`
- Message: `feat(imp-10): Wave A job platform core (registry, queue, runner, noop).`

### Commit 2 — Process lifecycle + docs surface

- Modify: `server.js` start/stop hooks  
- Modify: `README.md` internal jobs note  
- Ensure Commit 1 tests still pass with server integration smoke if added  
- Message: `feat(imp-10): wire in-process job runner to server lifecycle.`

### Commit 3 — Evidence close

- Create: `IMP10_IMPLEMENTATION_REPORT.md`, `IMP10_TEST_REPORT.md`, `IMP10_REGRESSION_REPORT.md`  
- Update: `IMP10_DECISION_LOG.md` / index / `plan/plan/tracking/decision_log.md`  
- Full suite green  
- Message: `docs(imp-10): Wave A reports and regression evidence.`  
- Push · **STOP**

*(If Human prefers a single squash commit instead: Commits 1–3 may be squashed to **one** Wave A delivery commit — call out at coding time; sequence above remains the logical build order.)*

---

## Coding gate

| Question | Answer |
|---|---|
| May production code be written **now**? | **NO** — wait for Human approval of **this** document |
| After approval? | Implement exactly this plan; then STOP for review |
| Wave B Imp-10 / Imp-12? | **Forbidden** until new authorization |

---

## Related documents

- `IMP10_DESIGN_REVIEW.md` — DR analysis (approved)  
- `IMP10_DECISION_LOG.md` — seal  
- `IMP10_SCOPE.md` / `IMP10_CAPABILITY_MATRIX.md` — investigation  
