# IMP10_IMPLEMENTATION_SCOPE.md

**Date:** 2026-07-15  
**Module:** Imp-10 Background Jobs  
**Mode:** Investigation — describes **future** code boundaries only

---

## What Imp-10 code WILL eventually be written (after DRs + auth)

Illustrative only — **not authorized now**:

| Area | Expected nature |
|---|---|
| Job module | Registry of job types; enqueue API (internal); runner loop |
| Policies | Idempotency key handling; retry/backoff; failure logging |
| Handlers | Thin functions that **call existing services** (if any job authorized) |
| Tests | Unit + integration proving retry/idempotency; regression Imp-01…12 Wave A |
| Docs | Implementation / test / regression reports under `implementation-10/` |

Optional (DR gated):

| Area | Gate |
|---|---|
| Additive `jobs` / `outbox` migration | DR-002=B + DR-004=B |
| Separate worker entrypoint | DR-001=B |
| Admin `/api/jobs` status | DR-006=B |

---

## What code MUST NEVER be written in Imp-10

| Never | Reason |
|---|---|
| Second `DeclarationSync` / trigger clone in a cron | Imp-06 owns sync; acceptance forbids unmapped trigger ports |
| Review transition logic copy | Imp-07 |
| New SSE transport / rewrite `/events` | Imp-09 LOCKED |
| Auth/session GoTrue / refresh redesign | Imp-02; Imp-12 DR-004 |
| Admin role lifecycle / phone rules | Imp-11 LOCKED |
| FE Edge/RPC/table business | Imp-12 |
| Edits under `chantier1/` | FE freeze |
| DROP / rewrite old migrations | UNION DB policy |
| Super Admin / multi-company / storage workers | Deferred / N/A |
| Imp-12 Wave B endpoints | Blocked |
| Internal `fetch('http://localhost/api/...')` for domain work | Prefer in-process service calls (same Imp-12 rule) |

---

## Modules REUSED (consume, do not fork)

| Module | Reuse |
|---|---|
| Imp-01 | env, pool, logger, correlation, health patterns |
| Imp-06 | Call timesheet services **only** when a DR-approved job must re-enter recording commands |
| Imp-07 | Call review services / respect existing hooks — no fork |
| Imp-09 | Optionally enqueue after emit / retry dispatch — **without** replacing SSE |

---

## Modules that remain UNTOUCHED (default)

| Module | Status |
|---|---|
| Imp-02 Authentication | Untouched |
| Imp-03 Users | Untouched |
| Imp-04 Chantiers | Untouched |
| Imp-05 Affectations/Zones | Untouched |
| Imp-06 Timesheet business | Untouched (emit thaw already closed under Imp-09) |
| Imp-07 Review business | Untouched |
| Imp-08 Export | Untouched |
| Imp-09 Realtime core | Untouched unless Human explicitly thaws for DR-003=A |
| Imp-11 Administration | Untouched |
| Imp-12 Wave A compat | Untouched |

---

## Differentiation: Phase 10 vs Imp-10

| | Phase 10 | Imp-10 |
|---|---|---|
| Kind | Historical **planning** phase docs | Wave 2 **coding** module |
| Path | `phases/phase_10_backend_implementation_planning/` | `implementation-reports/implementation-10/` + future `api-chantier` jobs module |
| Deliverable | Backlog / module order for the whole backend | Background Jobs reliability layer |

---

## Coding now?

**NO.**

Imp-10 investigation only.

Coding remains blocked until Human approval.
