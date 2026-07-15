# IMP10_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** OPEN — coding blocked  
**Do not reopen:** Imp-06/07/09/11 closed DRs; Imp-12 Wave A DRs; Imp-12 Wave B block

---

## DR-IMP10-001 — Process model for the job runner

**Question:** Where do Imp-10 jobs run?

| Option | Description |
|---|---|
| **A (recommended)** | **In-process** runner inside `api-chantier` (same Node process; start on boot; polling/interval or post-enqueue) |
| **B** | Separate worker process/container sharing DB |
| **C** | External broker (Redis/SQS/etc.) |

**Recommendation:** **A** — matches current Compose/single-API topology (ADR-001 Compose local); lowest invention.

**Impact:** A keeps ops simple; B/C add topology/secrets not present in Imp-01 Compose evidence without a new decision.

---

## DR-IMP10-002 — Job persistence

**Question:** Must jobs survive process restart?

| Option | Description |
|---|---|
| **A (recommended MVP)** | **Ephemeral in-memory** queue + structured logs (no new tables) |
| **B** | Additive SQL job/outbox tables (UNION DB policy; one new migration if authorized) |
| **C** | Defer persistence until Imp-13 / product SLA requires it |

**Recommendation:** **A** or **C** for first coding wave — Imp-09 proved **no CVL outbox tables**; inventing schema needs strong purpose.

**Impact:** A/C cannot guarantee missed SSE delivery across restarts; B enables durability but must justify vs Imp-09 “no Outbox” close.

---

## DR-IMP10-003 — Notification reliability scope

**Question:** Does Imp-10 close the Imp-09 “no Last-Event-ID replay / no buffer” gap?

| Option | Description |
|---|---|
| **A** | **Yes** — Imp-10 adds durable/retry delivery that feeds Imp-09 dispatcher/SSE (product changes Imp-09 guarantees) |
| **B (recommended)** | **No / DEFER** — leave Imp-09 contracts unchanged; Imp-10 ships platform only until a product SLA DR |
| **C** | Document-only: Imp-10 owns future reliability; implement zero notification jobs in first release |

**Recommendation:** **B** or **C** — Imp-09 FINAL explicitly closed without Outbox; changing delivery guarantees is product-level.

**Impact:** Choosing A reopens realtime reliability design and may need Imp-09 touch (forbidden without thaw). B/C keep Imp-09 frozen.

---

## DR-IMP10-004 — May Imp-10 add SQL?

**Question:** Is any additive migration allowed for Imp-10?

| Option | Description |
|---|---|
| **A** | **No SQL** in Imp-10 (mirror Imp-12 Wave A policy) |
| **B** | Exactly one additive migration if DR-002=B (job/outbox tables only; no DROP/rewrite) |
| **C** | Allow multiple additive migrations |

**Recommendation:** **A** unless Human chooses durable jobs (DR-002=B) → then **B**.

**Impact:** Controls schema UNION policy and review surface.

---

## DR-IMP10-005 — Which concrete jobs are authorized for first coding?

**Question:** After platform exists, which **named** jobs may ship?

| Option | Description |
|---|---|
| **A (recommended)** | **Platform-only**: health/noop job + harness tests; **zero** domain/notification jobs |
| **B** | Add only notification retry job (requires DR-003=A) |
| **C** | Add “reconciliation” job that re-calls Imp-06 sync for a day key |
| **D** | Empty list indefinitely — Imp-10 docs-only until Imp-13 |

**Recommendation:** **A** — proves DoD for runner without inventing domain async paths; C risks duplicating Imp-06 TX ownership if misused.

**Impact:** Prevents silent scope expansion into trigger re-ports.

---

## DR-IMP10-006 — Relationship to Imp-12 / FE

**Question:** Does Imp-10 expose any FE-facing endpoints?

| Option | Description |
|---|---|
| **A (recommended)** | **None** — jobs are internal; FE keeps Imp-09 `/events` + Imp-12 adapters |
| **B** | Admin job status API under `/api/jobs` (admin-only) |
| **C** | FE-visible job progress (needs FE contract — frozen → forbidden without adapter) |

**Recommendation:** **A**; B only if operations demand it under a later auth.

**Impact:** Avoids Imp-12/FE scope bleed.

---

## How Human closes

Example:

```
DR-IMP10-001 = A
DR-IMP10-002 = A
DR-IMP10-003 = B
DR-IMP10-004 = A
DR-IMP10-005 = A
DR-IMP10-006 = A
Authorize Wave A coding only
```

Until then: **NO production code.**
