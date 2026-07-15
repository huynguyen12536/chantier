# IMP10_ARCHITECTURE_REPORT.md

**Date:** 2026-07-15  
**Module:** Imp-10 Wave A  

---

## Architecture

```
server.js
  listen → startJobs()
  SIGINT/SIGTERM → stopJobs() → close HTTP → closePool

modules/jobs/
  index.js          → façade
  registry.js       → type → handler (builtins: platform_noop)
  queue.js          → ephemeral FIFO + reservedKeys + completedKeys
  runner.js         → serial poll / execute / retry
  policies.js       → backoff, shouldRetry, idempotency normalize
  correlation.js    → job correlation ids
  handlers/platformNoop.js
```

Jobs **do not** mount Express routes. Jobs **do not** import Imp-06…12 domain modules.

---

## Idempotency lifecycle

| State | Key reservation |
|---|---|
| QUEUED | `reservedKeys` |
| RUNNING | `reservedKeys` (kept after dequeue) |
| COMPLETED | removed from reserved; added to `completedKeys` (duplicates rejected) |
| FAILED (terminal) | reservation released (recovery enqueue allowed) |

---

## Known limitations

| Limitation | Cause | Policy |
|---|---|---|
| Jobs lost on restart | DR-002=A ephemeral queue | Intentional; persistence deferred |
| No missed-event SSE buffer | DR-003=B | Imp-09 guarantees unchanged |
| No domain/notification jobs | DR-005=A | Platform noop only |
| No horizontal worker scale | DR-001=A single process | Serial runner in API process |
| Completed-key memory grows | In-process Set | Process lifetime only; restart clears |

---

## Operational notes

| Env | Default | Meaning |
|---|---|---|
| `JOBS_ENABLED` | `true` | Set `false` to skip runner start and reject enqueue |
| `JOBS_POLL_MS` | `50` | Idle poll interval |
| `JOBS_MAX_ATTEMPTS` | `3` | Default retry budget |
| `JOBS_BACKOFF_CAP_MS` | `2000` | Cap for exponential backoff |

**Logs:** `jobs.enqueued` / `jobs.start` / `jobs.completed` / `jobs.retry` / `jobs.failed` / `jobs.runner.started|stopped` include `correlationId`.

**Disable without deploy rollback:** `JOBS_ENABLED=false`.

**Rollback:** revert Wave A commits; no migration to undo.
