# IMP10_IMPLEMENTATION_PLAN.md

**Date:** 2026-07-15  
**Status:** Investigation — coding **blocked**  
**Prerequisite:** Close DRs in `IMP10_DECISION_LOG.md` + Human wave authorization

---

## Naming

Do **not** confuse with historical **Phase 10** planning pack. This plan is for Wave 2 **Imp-10 Background Jobs** only.

---

## Wave 0 — Investigation (THIS DELIVERY)

| Field | Content |
|---|---|
| Purpose | Evidence-backed scope, matrix, DRs, waves |
| Business covered | None (docs only) |
| Files expected | `implementation-reports/implementation-10/*` |
| Touch points | Docs / tracking Decision Log row only |
| Dependencies | Imp-06/07/09 complete (met) |
| Risk | Mis-scoping Imp-10 as trigger re-port or Phase 10 ETL |
| Stop | **NOW** — no code |
| Review gate | Human accepts pack + answers DRs |

---

## Wave A — Job platform skeleton (NO domain business)

| Field | Content |
|---|---|
| Purpose | Add an evidence-minded **job runner** so approved jobs can execute with idempotency/retry/observability |
| Business covered | **None** — platform only (BJ-01…BJ-04) |
| Files expected (illustrative, not authorized) | e.g. `src/modules/jobs/` or `src/modules/background/` — `runner.js`, `registry.js`, `policies.js`, tests — exact layout via DR-IMP10-001 |
| Touch points | Additive module + `app.js`/`server.js` startup hook **only if** in-process runner chosen; **no** Imp-06…12 service rewrites |
| Dependencies | Imp-01 platform; DRs 001/002/005 |
| Risk | Building unused infrastructure; over-engineering Redis/Kafka without evidence |
| Stop | Platform tests green; **no** domain job handlers yet OR only noop/health job |
| Review gate | Human PASS before Wave B |

---

## Wave B — Reliability jobs that **invoke** existing modules

| Field | Content |
|---|---|
| Purpose | Implement **only** DR-approved jobs whose purpose is reliable processing of **already-owned** domain/notification signals |
| Business covered | Candidate: notification delivery retry / missed-client handling (**N-03**) **if** DR-IMP10-003 chooses not to DEFER; never re-owns timesheet/review rules |
| Files expected | Job handlers under jobs module; **calls** Imp-09 dispatcher / domain services in-process |
| Touch points | **Forbidden:** rewriting Imp-06 sync, Imp-07 transitions, Imp-09 SSE core. Allowed: thin handlers + tests |
| Dependencies | Wave A PASS; DR-IMP10-003/004 closed; Imp-09 CLOSED understood |
| Risk | Reopening Imp-09 “no Outbox” by inventing tables; duplicate emit paths |
| Stop | Compat/reliability tests prove handlers call services; domain regression green |
| Review gate | Human PASS; still no FE edit |

---

## Wave C — Hardening / ops

| Field | Content |
|---|---|
| Purpose | DLQ visibility, metrics, failure runbooks, concurrency limits |
| Business covered | Ops reliability for Imp-10 jobs only |
| Files expected | Metrics hooks, admin-read endpoints **only if DR**, docs |
| Dependencies | Wave A (+ B if any jobs exist) |
| Risk | Scope creep into Imp-13 Production Readiness |
| Stop | DoD checklist from roadmap met for implemented jobs |
| Review gate | Human PASS → Imp-10 COMPLETE |

---

## Explicitly excluded waves (do not create)

| Fake wave | Why excluded |
|---|---|
| “Reimplement triggers as cron” | Violates Imp-10 acceptance + Imp-06/07 ownership |
| “Imp-12 Wave B inside Imp-10” | Wrong owner |
| “ETL cutover jobs” | Imp-13 / Phase 11 |
| “Auth session worker” | Imp-02 / forbidden GoTrue |

---

## Sequencing vs other Imps

```
Imp-06 TX sync ──┐
Imp-07 review TX ─┼─ already COMPLETE ──→ Imp-09 SSE emit (COMPLETE)
Imp-11 Admin ─────┘                         │
Imp-12 Wave A ──── COMPLETE                 ▼
                                   Imp-10 jobs (THIS) — optional reliability
                                   Imp-12 Wave B — BLOCKED (separate auth)
                                   Imp-13 Prod readiness — later
```

---

## Global stop rules

1. No coding in Wave 0.  
2. No Wave B without Wave A review + DRs.  
3. No job may write `periodes_travail` / `declarations_heures` except by calling Imp-06/07 services.  
4. No SQL migration without DR-IMP10-004.
