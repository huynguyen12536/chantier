# IMP10_WAVE_B_DESIGN_REVIEW.md

**Date:** 2026-07-15  
**Input:** `IMP10_WAVE_B_DECISION_LOG.md` (DR-B-001…006)  
**Mode:** Design review only — **no production code**  
**Investigation accepted:** Human ACCEPTED Imp-10 Wave B investigation pack  

**Evidence / SoT:**

| Source | Use in this review |
|---|---|
| `WAVE2_IMPLEMENTATION_ROADMAP.md` Imp-10 | Wave B = reliability jobs invoking existing modules; no Outbox invent |
| `ADR-001_UNIFIED_BACKEND_ARCHITECTURE.md` | Compose-as-local topology; Notification module ownership; deferred exact deploy |
| `unified/logic/02_SINGLE_WRITE_PATH.md` | Jobs invoke domain commands; no competing period/declaration writes |
| `migration-analysis/merge/triggers_mapping.md` | Sync owned by Imp-06/07 services — not cron/job re-ports |
| Imp-09 FINAL / architecture | SSE; no Outbox; `lastEventIdReplay: false` |
| Imp-10 Wave A architecture / closure | In-process ephemeral runner; platform_noop only; DR-001…006 locked |
| Imp-12 Wave A | Compat HTTP/RPC layer; FE frozen; Wave B adapters out of Imp-10 |

**Rule:** Do not invent architecture beyond options already framed in the Wave B DR log.

---

## Consistency gate (global)

Before per-DR analysis, the recommended seal below stays consistent with:

| Gate | Status under recommended seal |
|---|---|
| WAVE2 Imp-10 Wave B text | ✓ notification-style reliability job; no Outbox invent |
| ADR-001 | ✓ same Node API process; Notification delivery stays Imp-09 |
| `02_SINGLE_WRITE_PATH.md` | ✓ JB-01 does not write period/declaration state |
| `triggers_mapping.md` | ✓ no trigger→cron; DeclarationSync remains Imp-06 TX path |
| Imp-09 FINAL | ✓ no Outbox; no Last-Event-ID replay; transport not rewritten |
| Imp-10 Wave A | ✓ extends registry/handlers only; keeps ephemeral in-process |
| Imp-12 Wave A | ✓ no compat/FE edits; no adapter work in Wave B1 |

---

## JB-01 verification (mandatory)

| Criterion | Verdict | Evidence / mechanism |
|---|---|---|
| Only evidence-backed **production** job for Wave B1 | **PASS** | Matrix: JB-02/03 invent durability; JB-04–06 lack CVL job evidence / high write-path risk; Wave A noop already shipped |
| No second write path | **PASS** | Calls Imp-09 `dispatchCatalogEvent` only — SSE fan-out, no period/declaration SQL |
| Invokes existing Imp-09 services only | **PASS** | Handler payload → `dispatchCatalogEvent`; no Imp-06/07 imports |
| No direct SQL | **PASS** | No migrations; no pool/query in handler |
| No business mutations | **PASS** | No approve/createPeriod/syncDeclarations |
| Does not reopen Imp-06 / Imp-07 ownership | **PASS** | Those modules untouched under DR-B-004=B |
| No Redis / Kafka / Outbox / replay buffer / worker | **PASS** | DR-B-003/005/006 recommended A/A/B |

**Honest limitation (accepted under DR-B-001=A):**  
On `writeEvent` failure Imp-09 already `removeClient`s the failing client. A later in-process redispatch cannot deliver to that removed client and may re-fan-out to clients that already received the first pass (duplicate SSE frame). Wave B1 therefore provides **best-effort retry of catalog fan-out**, not durable missed-event recovery. That is still preferable to inventing Outbox/replay (rejected by Imp-09 + DR-B-006) and still matches WAVE2’s “notification retry” lane without product invention.

---

# DR-IMP10-B-001 — Wave B product scope

**Question:** What ships in the first Wave B coding authorization?

### Options

| Option | Meaning |
|---|---|
| **A** | B1 only: JB-01 in-memory catalog redispatch (+ optional Imp-09 failure→enqueue per B-002) |
| **B** | B1 + JB-04 day resync repair |
| **C** | Reopen durable reliability (buffer/Outbox) — change Imp-09 guarantees |
| **D** | Docs-only — defer all Wave B coding indefinitely |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Matches WAVE2 Wave B example (“notification retry”); reuses Wave A platform; zero SQL; zero Imp-06/07 thaw; lowest invention | Limited reliability vs restart / reconnect (G-01/G-02 remain); possible duplicate SSE frames |
| **B** | Adds ops repair narrative | Touches Imp-06 sync; **second-path smell** vs `triggers_mapping` + single write path; no CVL “resync job” evidence |
| **C** | Stronger missed-event SLA | Directly contradicts Imp-09 FINAL + Wave A DR-003=B + roadmap “must not invent Outbox without product decision” |
| **D** | Zero code risk | Leaves WAVE2 Wave B empty; G-03 unaddressed after investigation acceptance |

### Architecture impact

- **A:** Additive job type on Imp-10; Imp-09 remains transport owner.  
- **B:** Jobs begin invoking Time Recording write-side sync outside request TX.  
- **C:** Reopens Notification durability as a platform product change.  
- **D:** No architecture change.

### Implementation impact

- **A:** One handler + registry + tests (+ optional dispatcher hook).  
- **B:** Additional handler, DB client/TX wrapping, Imp-06 surface design.  
- **C:** Migrations and/or Imp-09 redesign.  
- **D:** Docs only.

### Regression impact

- **A:** Jobs + realtime tests; Imp-06/07/11/12/FE must stay green and **file-diff clean** for domain.  
- **B:** Timesheet/validation regression critical.  
- **C:** Broad realtime + possibly schema regression.  
- **D:** None.

### Compatibility impact (Imp-12 / FE)

- **A–D:** No FE contract change. **C** could change SSE reconnect semantics (compat risk) if replay is later exposed.

### Recommendation: **A**

Preferred because it is the only option that (1) ships an evidence-aligned reliability job, (2) stays inside Imp-10 Wave B roadmap text, and (3) does not reopen Imp-06/07/09 product seals.

### Rejected

- **B:** Premature; fails single-write / triggers ownership bar without clear SoT job evidence.  
- **C:** Product invention vs Imp-09 FINAL and WAVE2 Outbox caution.  
- **D:** Investigation accepted implying coding consideration; total defer undoes Wave B purpose after acceptance.

---

# DR-IMP10-B-002 — Imp-09 thaw for enqueue hook

**Question:** May Wave B add a minimal hook when `writeEvent` fails to call Imp-10 `enqueueJob`?

### Options

| Option | Meaning |
|---|---|
| **A** | Yes — on write failure only, enqueue JB-01 with catalog payload; no transport rewrite |
| **B** | No Imp-09 edits — redispatch only if something else enqueues |
| **C** | Broader Imp-09 reliability rewrite (replay buffer) |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Gives JB-01 a real producer; keeps thaw localized to failure path | Edits LOCKED Imp-09 file(s); must avoid circular import / double-enqueue storms |
| **B** | Zero Imp-09 file risk | JB-01 becomes nearly unreachable in production (no natural enqueue) |
| **C** | Full reconnect story | Violates Imp-09 FINAL; invents buffer; pairs with DR-B-006=A |

### Architecture impact

- **A:** Notification module may call Jobs façade on failure — jobs still do not own SSE. Care: import graph `realtime → jobs → realtime` must be structured (lazy import / inject enqueue) so Wave A load order stays sound.  
- **B:** Jobs remain dead code for domain.  
- **C:** Redesigns Imp-09.

### Implementation / regression / compatibility

- **A:** Touch `dispatcher.js` (and possibly a tiny helper); new Wave B1 tests for write-fail→enqueue→redispatch. Realtime tests must still prove no replay flag. Imp-12 untouched.  
- **B:** Jobs tests for handler only; weak end-to-end value.  
- **C:** Large Imp-09 + FE reconnect expectations risk.

### Recommendation: **A** (requires B-001=A)

Preferred because without a producer, B-001=A is hollow; a write-failure hook is the minimal thaw consistent with “invoke existing modules” rather than inventing a new HTTP enqueue API (Wave A DR-006=A stands).

### Rejected

- **B:** Starves JB-01.  
- **C:** Reopens Imp-09 product architecture; forbidden under DR-B-006 recommended B.

---

# DR-IMP10-B-003 — Persistence for Wave B

**Question:** May Wave B add SQL / Redis for job or event durability?

### Options

| Option | Meaning |
|---|---|
| **A** | No — remain ephemeral (Wave A DR-002/004 stand) |
| **B** | Exactly one additive job/outbox migration |
| **C** | External broker (Redis etc.) |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Consistent with Wave A seal; Imp-09 “no Outbox”; no schema invention | Restart still loses queue (G-01) |
| **B** | Survives restart | Invents tables without CVL job/outbox evidence; roadmap forbids Outbox invent without product decision |
| **C** | Industry durability | Absent from ADR-001 Compose SoT; invents topology |

### Architecture / implementation / regression / compatibility

- **A:** No migrations; platform unchanged.  
- **B:** UNION migration + new persistence layer; reopens Wave A DR-004.  
- **C:** New service + secrets; ADR-001 topology invention.

### Recommendation: **A**

Preferred to keep Wave B1 a thin reliability handler on the sealed Wave A platform, and to avoid conflating Imp-10 jobs with a new durable messaging subsystem.

### Rejected

- **B / C:** Invent persistence products Imp-09 and Wave A explicitly deferred.

---

# DR-IMP10-B-004 — Day-key resync job (JB-04)

**Question:** Authorize `jobs.timesheet.resync_day` invoking Imp-06 sync?

### Options

| Option | Meaning |
|---|---|
| **A** | Yes — ops/repair only; no schedule; internal enqueue |
| **B** | No — sync remains solely Imp-06 request TX path |
| **C** | Yes + periodic cron for all open days |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Ops escape hatch | Second invoke path of DeclarationSync outside user request; actor/TX design hard |
| **B** | Preserves Imp-06 ownership + `triggers_mapping` mapping | No automated repair job |
| **C** | Looks like “always sync” | Closest to forbidden legacy-trigger-as-cron re-port (Imp-10 acceptance) |

### Architecture / implementation / regression / compatibility

- **A:** Imp-06 thaw for export/wrapping; risky regressions on declaration projection.  
- **B:** Zero Imp-06 touch.  
- **C:** Scheduled mass writes — highest regression and ownership risk.

### Recommendation: **B**

Preferred because `triggers_mapping.md` already maps sync to Imp-06 Time Recording services inside the write path; Wave B must not become a parallel Declarations sync engine.

### Rejected

- **A:** Evidence-weak; second write-path pressure.  
- **C:** Explicitly conflicts with Imp-10 acceptance (“no legacy trigger ported without mapped service/event path” as cron replacement).

---

# DR-IMP10-B-005 — Process model for Wave B

**Question:** Keep in-process runner?

### Options

| Option | Meaning |
|---|---|
| **A** | Keep Wave A DR-001=A in-process |
| **B** | Separate worker process |
| **C** | Broker workers |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | ADR-001 Compose local topology; reuse Wave A lifecycle | Shares process with HTTP |
| **B** | CPU isolation | New topology not in Imp-01 Compose evidence |
| **C** | Scale fan-out | Invents broker |

### Architecture / implementation / regression / compatibility

- **A:** No new deploy unit; JB-01 shares memory with SSE clients (required for meaningful same-process redispatch).  
- **B/C:** Would **weaken** JB-01 (job worker may not share `sseRegistry` clients without redistributing state).

### Recommendation: **A**

Preferred because JB-01’s only non-durable value depends on the **same process** owning both the queue and the SSE registry — exactly Wave A’s model.

### Rejected

- **B / C:** Topology invention; harms JB-01 co-location assumption; no SoT change since Wave A.

---

# DR-IMP10-B-006 — Replay buffer / Last-Event-ID resume

**Question:** Does Wave B implement server-side event replay for reconnecting SSE clients?

### Options

| Option | Meaning |
|---|---|
| **A** | Yes — durable buffer + honor Last-Event-ID |
| **B** | No — preserve Imp-09 `lastEventIdReplay: false` |
| **C** | Document-only future Imp |

### Advantages / disadvantages

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Fixes G-02 for reconnecting clients | Invents Outbox/buffer; contradicts Imp-09 FINAL |
| **B** | Honors Imp-09 close; FE refresh patterns remain valid | G-02 remains |
| **C** | Clear defer without fake implementation | No Wave B code for G-02 (acceptable) |

### Architecture / implementation / regression / compatibility

- **A:** Imp-09 redesign + FE reconnect contract shift (Imp-12 concern).  
- **B:** Imp-09 tests for `lastEventIdReplay: false` must continue to pass.  
- **C:** Docs only for G-02; compatible with B.

### Recommendation: **B**

Preferred as the coding-time rule. Option **C** may accompany B as documentation of G-02 deferral, but the **DR answer for Wave B implementation** is **B** (do not build replay).

### Rejected

- **A:** Explicitly forbidden by investigation rules and Imp-09 FINAL without a new product Imp.  
- Framing **C** as the DR winner would under-specify “do we code replay?” — reject C as primary seal letter; use B.

---

## Recommended DR seal

```
DR-IMP10-B-001 = A
DR-IMP10-B-002 = A
DR-IMP10-B-003 = A
DR-IMP10-B-004 = B
DR-IMP10-B-005 = A
DR-IMP10-B-006 = B
```

**Coding still requires:** Human formal seal of the above + authorization wording “Authorize Wave B1 coding.”

---

## Explicit answers

### 1. Can Wave B1 begin?

**Historical answer (at design-review time):** Coding was blocked pending DR seal. **Current:** Human sealed DRs and authorized Wave B1; Imp-10 is **CLOSED**. Wave B2 / Outbox / FE remain out of scope; Wave C is **DEFERRED**.

### 2. Exactly which production files will be created?

| Path | Purpose |
|---|---|
| `api-chantier/src/modules/jobs/handlers/realtimeRedispatch.js` | Thin JB-01 handler → Imp-09 `dispatchCatalogEvent` |
| `api-chantier/test/jobs.waveB1.test.js` | Wave B1 unit/integration tests (name may match repo convention) |

Docs reports after coding (not “production runtime”) may be added under `implementation-reports/implementation-10/` — out of this design-review step.

### 3. Exactly which existing files will be modified?

| Path | Change nature |
|---|---|
| `api-chantier/src/modules/jobs/jobTypes.js` | Add `JOB_REALTIME_REDISPATCH_CATALOG` (or final constant) |
| `api-chantier/src/modules/jobs/registry.js` | Register builtin JB-01 alongside platform_noop |
| `api-chantier/src/modules/jobs/index.js` | Export new type constant if needed; keep façade |
| `api-chantier/src/modules/realtime/dispatcher.js` | **Minimal thaw (DR-B-002=A):** on `writeEvent` failure (or when delivered path detects false), `enqueueJob` JB-01 with catalog payload + idempotencyKey — no transport rewrite |

**Explicitly not modified:** Imp-06/07 modules, Imp-11/12, `migrations/`, `chantier1/`, Imp-09 routes/serializer/scope (unless a shared tiny enqueue helper is extracted — prefer keep hook inside `dispatcher.js` only).

### 4. What production code is still forbidden?

- Second write path / Imp-06 `syncDeclarationsFromPeriods` / Imp-07 decisions as jobs  
- Direct SQL / migrations / Outbox tables  
- Redis / Kafka / brokers  
- Separate worker process  
- Last-Event-ID replay buffer / durable event store  
- FE / Imp-12 Wave B adapters  
- Duplicating business logic inside handlers  
- Internal HTTP self-calls  
- Broad Imp-09 rewrite (WebSocket, PG NOTIFY client, Outbox)  
- Wave C admin `/api/jobs` (still Wave A DR-006=A)  
- JB-04 / JB-05 / JB-06 handlers under this seal  

### 5. What tests will be required?

| Test | Intent |
|---|---|
| Handler success | Payload → `dispatchCatalogEvent` called once with expected fields |
| Idempotency | Same `idempotencyKey` does not double-reserve conflicting jobs (Wave A queue rules) |
| Failure→enqueue | Simulated `writeEvent` false → job enqueued (B-002) |
| Redispatch execute | Runner picks up JB-01 and invokes dispatcher |
| No replay regression | Imp-09 `lastEventIdReplay: false` / Last-Event-ID echo behavior unchanged |
| No domain fork | Assert tests do not open Imp-06/07 service mutations |
| Jobs disabled | `JOBS_ENABLED=false` → no enqueue side-effect or safe no-op per Wave A policy |

### 6. What regression suite must pass before Wave B1 is considered complete?

| Gate | Requirement |
|---|---|
| Wave B1 jobs tests | New `jobs.waveB1` file **all PASS** |
| Full API suite | `api-chantier/test/**/*.test.js` **all PASS** (Wave A was 92; expect ≥ that + new cases) |
| Diff discipline | No unintended edits under `timesheet/`, `validation/` (business), `compat/`, `users/`, `migrations/`, `chantier1/` |
| Imp-09 contract | Existing realtime tests remain green (auth, heartbeat, no-replay) |
| Docs closure | Wave B1 implementation / test / regression reports + checklist after coding (post-authorization) |

---

## STOP

```
Imp-10 Wave B DESIGN REVIEW delivered.
NO production code written.
Await Human DR seal + “Authorize Wave B1 coding” before any implementation.
```
