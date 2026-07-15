# IMP10_WAVE_A_COMPLETION_CHECKLIST.md

**Date:** 2026-07-15  
**Status:** Wave A engineering complete — **await Human review seal**

## Checklist

| # | Criterion | Status |
|---|---|---|
| 1 | In-process runner (DR-001=A) | PASS |
| 2 | Ephemeral in-memory queue (DR-002=A) | PASS |
| 3 | No Imp-09 replay/outbox closing (DR-003=B) | PASS |
| 4 | No SQL / migrations (DR-004=A) | PASS |
| 5 | Only `jobs.platform_noop` builtin (DR-005=A) | PASS |
| 6 | No `/api/jobs` REST (DR-006=A) | PASS |
| 7 | Registry + policies + retry + idempotency QUEUED/RUNNING | PASS |
| 8 | Observability / correlation on job logs | PASS |
| 9 | `server.js` start/stop wired | PASS |
| 10 | README documents internal + ephemeral semantics | PASS |
| 11 | Unit/integration jobs tests green (12/12) | PASS |
| 12 | Full regression 92/92 | PASS |
| 13 | Imp-06…12 / FE / migrations untouched | PASS |
| 14 | No notification / domain jobs | PASS |
| 15 | No Redis / Kafka / worker process | PASS |
| 16 | Wave B **not** started | PASS |

## DR constraints evidence

| Constraint | Evidence |
|---|---|
| No SQL | No files under `migrations/` in Wave A commits |
| No REST jobs | No `routes.js` in `modules/jobs`; `app.js` unchanged for jobs |
| No FE | `chantier1/` not in Wave A diffs |
| No notification jobs | Registry builtins = `platform_noop` only |
| No domain jobs | No imports from timesheet/validation/export/realtime/users/compat |
| No replay buffer | No Imp-09 edits; DR-003=B |
| No outbox / Redis / Kafka / worker | Architecture + code tree |

## Known limitations (summary)

- Memory queue lost on restart (by design).  
- Platform-only — no business async yet.  
- Completed idempotency keys live in memory until process exit.

## Operational notes (summary)

- Disable: `JOBS_ENABLED=false`.  
- Tune: `JOBS_POLL_MS`, `JOBS_MAX_ATTEMPTS`, `JOBS_BACKOFF_CAP_MS`.  
- Shutdown: `stopJobs()` before pool close.

## STOP

Imp-10 Wave A coding + Milestone 3 docs done. **Do not start Wave B** without new Human authorization.
