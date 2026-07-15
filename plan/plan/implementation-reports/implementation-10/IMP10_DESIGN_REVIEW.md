# IMP10_DESIGN_REVIEW.md

**Date:** 2026-07-15  
**Input:** `IMP10_DECISION_LOG.md` DRs 001–006  
**Mode:** Design review only — **no production code**  
**Evidence base:** WAVE2 Imp-10 · ADR-001 · `02_SINGLE_WRITE_PATH.md` · `triggers_mapping.md` · Imp-01…12 reports (esp. Imp-09 FINAL) · Imp-10 investigation pack

**Rule:** Do not invent architecture beyond options already framed in the investigation DR log.

---

## DR-IMP10-001 — Process model for the job runner

**Question:** Where do Imp-10 jobs run?

### Options

| Option | Meaning |
|---|---|
| **A** | In-process runner inside `api-chantier` (same Node process; start on boot) |
| **B** | Separate worker process/container sharing DB |
| **C** | External broker (Redis / SQS / etc.) |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Matches ADR-001 Compose-as-local-topology; zero new services; Imp-09 already uses in-process emit; simplest tests | Jobs share memory/CPU with HTTP; restart loses ephemeral queue (see DR-002) |
| **B** | Isolates CPU; scales workers independently | New process not in Imp-01 Compose evidence; deployment topology ADR says deferred; more ops/orchestration |
| **C** | Industry durability/fan-out | Invents broker dependency absent from SoT; secrets/topology invention; violates “do not invent” |

### Impact on existing architecture

- **A:** Additive module + `server.js` lifecycle hook. Domain modules stay owners; jobs invoke services in-process (aligned with `02_SINGLE_WRITE_PATH.md`: “jobs … invoke these commands”).
- **B/C:** Change runtime topology beyond current modular Express single API proven by Imp-01…12.

### Recommendation: **A**

Technical justification: WAVE2 Imp-10 is a reliability layer over an already-modular Express app; Imp-09 SSE dispatch is already in-process; ADR-001 names Compose local topology and deferred exact deployment — introducing workers/brokers now is invention.

### Rejected

- **B:** Premature topology; no Compose worker service evidence.
- **C:** No Redis/SQS in stack or migration-analysis; invents product.

---

## DR-IMP10-002 — Job persistence

**Question:** Must jobs survive process restart?

### Options

| Option | Meaning |
|---|---|
| **A** | Ephemeral in-memory queue + structured logs (no tables) |
| **B** | Additive SQL job/outbox tables |
| **C** | Defer persistence until Imp-13 / product SLA |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | No SQL; respects Imp-09 finding of **no CVL outbox tables**; enough to prove Wave A runner DoD | Jobs lost on restart |
| **B** | Durable across restarts | Invents schema without CVL job/outbox evidence; conflicts with Imp-09 “closed without Outbox” unless new product SLA |
| **C** | Avoids premature storage | Leaves Wave A without a queue to exercise — harder to meet Imp-10 acceptance (retry/idempotency) in code |

### Impact

- **A:** Jobs module only; no migrations.
- **B:** Requires DR-004=B; UNION additive migration; risk of reopening Imp-09 reliability product decision.
- **C:** Docs-heavy; delays proof of runner.

### Recommendation: **A**

Justification: Wave A is platform skeleton. Ephemeral queue proves enqueue/execute/retry/idempotency without inventing DB. Durability is a product decision for later (Wave B+/Imp-13), not required to start Imp-10.

### Rejected

- **B:** No CVL job tables; Imp-09 FINAL forbade inventing Outbox for realtime; same bar applies here without new evidence.
- **C:** Blocks practical Wave A DoD; “defer all storage” better as later upgrade path from A, not the starting mode.

---

## DR-IMP10-003 — Notification reliability scope

**Question:** Does Imp-10 close Imp-09 “no Last-Event-ID replay / no buffer”?

### Options

| Option | Meaning |
|---|---|
| **A** | Yes — durable/retry delivery feeding Imp-09 dispatcher/SSE |
| **B** | No / DEFER — Imp-09 contracts unchanged; platform first |
| **C** | Document Imp-10 owns future reliability; zero notification jobs in first release |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Addresses known gap | Changes Imp-09 closed guarantees; may thaw Imp-09; invents Outbox-like behavior; forbidden without product reopen |
| **B** | Keeps Imp-09 LOCKED; clear boundary | Gap remains until later DR |
| **C** | Same freeze as B; explicit “no notif jobs” | Overlaps B; weaker “owner of future” language |

### Impact

- **A:** Touches Imp-09 ownership; Wave B notification jobs; possible SQL (conflicts with recommended 002/004).
- **B/C:** Wave A stays platform-only; Imp-09 untouched.

### Recommendation: **B**

Justification: Imp-09 FINAL explicitly closed without Outbox/replay. WAVE2 Imp-10 may *later* support notification reliability, but must not silently reopen Imp-09. Prefer explicit future DR over A now. C is nearly identical for Wave A; **B** is clearer as the product stance (“do not close the gap in this Imp-10 phase”).

### Rejected

- **A:** Violates Imp-09 lock and “never invent Outbox” evidence without Human product change.
- **C:** Acceptable alternate; slightly weaker than B for decision clarity (B = do not close gap; C = docs-only claim of ownership). Prefer B.

---

## DR-IMP10-004 — May Imp-10 add SQL?

### Options

| Option | Meaning |
|---|---|
| **A** | No SQL in Imp-10 |
| **B** | Exactly one additive migration if DR-002=B |
| **C** | Multiple additive migrations |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Matches Imp-12 Wave A discipline; pairs with DR-002=A | No durable jobs |
| **B** | Enables durable queue if chosen | Only valid with 002=B |
| **C** | Flexibility | Scope creep; unnecessary for Wave A |

### Impact

- **A:** Migrations folder untouched.
- **B/C:** New migration file(s); review surface expands.

### Recommendation: **A**

Justification: Follows DR-002=A. No job schema evidence in CVL. DATABASE_EVOLUTION_POLICY allows additive tables only when needed — Wave A does not need them.

### Rejected

- **B:** Contingent on 002=B (rejected).
- **C:** Over-permission; no evidence for multiple tables.

---

## DR-IMP10-005 — Concrete jobs for first coding

### Options

| Option | Meaning |
|---|---|
| **A** | Platform-only: health/noop job + harness tests |
| **B** | Notification retry job (needs DR-003=A) |
| **C** | Reconciliation job re-calling Imp-06 sync for a day key |
| **D** | Empty list indefinitely — docs-only until Imp-13 |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Proves DoD without domain invention; safe | No production business value yet |
| **B** | Real reliability | Blocked by 003≠A; invents notif retry path |
| **C** | Sounds useful | Risks second write-path smell; sync already Imp-06 TX; easy to misuse as trigger re-port |
| **D** | Zero risk | Does not implement Imp-10; fails WAVE2 module goal |

### Impact

- **A:** Handlers stay inside jobs module; Imp-06/07/09 untouched.
- **B:** Requires Imp-09 integration.
- **C:** Temptation to bypass ownership; needs strong guardrails even if later approved.
- **D:** No Wave A coding.

### Recommendation: **A**

Justification: WAVE2 acceptance requires evidence-backed purpose **per job**. A noop/platform-health job’s purpose is proving the runner (idempotency/retry/observability) — not inventing domain async. Matches Imp-10 plan Wave A “NO domain business”.

### Rejected

- **B:** Depends on rejected 003=A.
- **C:** Domain sync is Imp-06 TX; not Wave A.
- **D:** Contradicts starting Imp-10 implementation after investigation acceptance.

---

## DR-IMP10-006 — Relationship to Imp-12 / FE

### Options

| Option | Meaning |
|---|---|
| **A** | No FE-facing endpoints; jobs internal |
| **B** | Admin `/api/jobs` status API |
| **C** | FE-visible job progress |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | No FE/Imp-12 bleed; FE freeze safe | Ops must use logs |
| **B** | Ops visibility | New HTTP surface; auth/RBAC scope; not required for Wave A |
| **C** | UX | Requires FE contract / Imp-12 Wave B — **blocked**; freeze violation risk |

### Impact

- **A:** No `app.js` route mounts for jobs.
- **B:** New routes + Imp-02 role gate.
- **C:** Forbidden under current Imp-12 Wave B block + FE freeze.

### Recommendation: **A**

Justification: Imp-10 Wave A has no FE contract. Imp-12 Wave B blocked. Internal APIs + logs + tests suffice.

### Rejected

- **B:** Premature; defer to Wave C if ops demand after review.
- **C:** FE frozen; Wave B Imp-12 blocked.

---

## Final implementation authorization (recommended seal)

```
DR-IMP10-001 = A
DR-IMP10-002 = A
DR-IMP10-003 = B
DR-IMP10-004 = A
DR-IMP10-005 = A
DR-IMP10-006 = A
```

---

## Can Wave A begin?

**YES** — under the seal above.

Wave A implements the **job platform skeleton** (+ platform noop/health job only).  
**No** notification reliability, **no** SQL, **no** FE endpoints, **no** Imp-06/07/09 rewrites, **no** Imp-12 Wave B.

**Coding still requires Human approval** of this design review + `IMP10_WAVE_A_IMPLEMENTATION_PLAN.md`.
