# IMP10_CAPABILITY_MATRIX.md

**Date:** 2026-07-15  
**Module:** Imp-10 Background Jobs  
**Rule:** Evidence-backed only. Absence of CVL “job tables” ≠ invent queue schema without DR.

---

## Legend

| Column | Meaning |
|---|---|
| Source | Document / code evidence |
| Owner | Imp that owns the **business/capability** |
| Current | What exists today in Unified |
| Need Imp-10 code? | Whether Future Imp-10 may touch |
| Wave | Proposed future implementation wave |

---

## A. Platform / reliability capabilities (Imp-10 candidate ownership)

| Cap ID | Capability | Source | Owner | Current implementation | Need Imp-10 code? | Future wave |
|---|---|---|---|---|---|---|
| BJ-01 | Reliable async job execution framework | WAVE2 Imp-10 goal/DoD | **Imp-10** | None | **Yes** (if coding authorized) | A |
| BJ-02 | Per-job idempotency key | WAVE2 Imp-10 acceptance | **Imp-10** | None | Yes | A |
| BJ-03 | Retry / backoff / failure policy | WAVE2 Imp-10 acceptance | **Imp-10** | None | Yes | A |
| BJ-04 | Job run observability (logs + correlation) | WAVE2 + Imp-01 ADR observability | Imp-10 + Imp-01 | Correlation global only | Yes | A |
| BJ-05 | Dead-letter / poison handling | Implied by failure policy DoD | **Imp-10** | None | Yes (after DR) | A/C |
| BJ-06 | Job persistence (optional table/outbox) | Imp-09: **no CVL outbox tables**; Imp-07 “mechanism later” | **DR gated** | None | **Only if DR chooses persisted jobs** | B |
| BJ-07 | Separate worker process | Not specified in SoT | **DR gated** | Same Node process only | Only if DR chooses | A |

---

## B. Domain capabilities already delivered (NOT Imp-10 rewrite)

| Cap ID | Capability | Source | Owner | Current | Need Imp-10 code? | Wave |
|---|---|---|---|---|---|---|
| D-01 | Period write + declaration sync | triggers_mapping; Imp-06 | Imp-06 | In-TX `DeclarationSyncService` | **No** — reuse only | — |
| D-02 | Soft Annulee empty day | DR-IMP06-001 | Imp-06 | Implemented | No | — |
| D-03 | Auto-approve matching shift + audit | DR-IMP06-003 | Imp-06/07 | Implemented | No | — |
| D-04 | Review transitions + period propagation | triggers_mapping; Imp-07 | Imp-07 | In-TX + audited | No | — |
| D-05 | Post-COMMIT timesheet emit | DR-IMP09-002 | Imp-06 thaw minimal | Implemented | No rewrite | — |
| D-06 | Review emit hooks | DR-IMP09-003 | Imp-07/09 | Implemented | No rewrite | — |
| D-07 | SSE scoped delivery `/events` | Imp-09 CLOSED | Imp-09 | Live SSE | No | — |
| D-08 | Last-Event-ID no replay | Imp-09 hardening | Imp-09 | By design none | **Maybe** reliability job — **DR** | B |
| D-09 | Export validated payroll | Imp-08 | Imp-08 | Sync HTTP | No | — |
| D-10 | Admin PATCH / role lifecycle | Imp-11 | Imp-11 | REST | No | — |
| D-11 | FE Edge/RPC/profiles adapters | Imp-12 Wave A | Imp-12 | Compat routes | No | — |

---

## C. Notification reliability (gap analysis — needs DR)

| Cap ID | Capability | Source | Owner | Current | Need Imp-10 code? | Wave |
|---|---|---|---|---|---|---|
| N-01 | Contract-equivalent refresh signals | realtime_mapping; Imp-09 | Imp-09 | In-process dispatcher → SSE | Reliability only via DR | B |
| N-02 | Durable event buffer / missed delivery | Imp-09 FINAL: **explicitly no Outbox**; no CVL notif tables | DR / product | Absent by design | **Ambiguous** — inventing contradicts Imp-09 close unless new DR | B or DEFER |
| N-03 | Retry failed SSE fan-out | Implied by “reliable…notifications” roadmap wording | Imp-10 candidate | None | Yes if DR scopes it | B |
| N-04 | Jobs invoke domain commands (not raw SQL) | `02_SINGLE_WRITE_PATH.md` | Imp-10 pattern | N/A | Constraint for any job | All |

---

## D. Explicit non-capabilities (do not assign to Imp-10)

| Cap ID | Capability | Why not Imp-10 |
|---|---|---|
| X-01 | Port `trigger_sync_*` as background cron sync | Already Imp-06/07 TX; acceptance forbids unmapped trigger ports |
| X-02 | Re-run Edge create/delete as jobs | Imp-03/11 + Imp-12 adapters |
| X-03 | FE PostgREST Wave B tables | Imp-12 Wave B (blocked) |
| X-04 | Auth GoTrue | Imp-02; Imp-12 DR-004=B |
| X-05 | ETL / data migration workers | Phase 11 / Imp-13 |
| X-06 | Super Admin / multi-company jobs | Deferred Decision Log |
| X-07 | Storage jobs | N/A — no storage contract |
| X-08 | Enable commented week auto-approve RPC | Inactive FE contract |

---

## E. Summary counts

| Bucket | Count implication |
|---|---|
| Must never rewrite (domain) | D-01…D-11 |
| Imp-10 primary (platform) | BJ-01…BJ-05 |
| Gated / open | BJ-06, BJ-07, N-02, N-03 |
| Forbidden assign | X-01…X-08 |

---

## Evidence index

| Evidence | Path |
|---|---|
| Module definition | `plan/plan/WAVE2_IMPLEMENTATION_ROADMAP.md` Imp-10 |
| Jobs invoke commands | `migration-analysis/unified/logic/02_SINGLE_WRITE_PATH.md` |
| Trigger → services | `migration-analysis/merge/triggers_mapping.md` |
| Edge (not Imp-10) | `migration-analysis/merge/edge_functions_mapping.md` |
| Imp-09 no outbox / no replay | `IMP09_FINAL_REPORT.md`, `IMP09_ARCHITECTURE.md` |
| Imp-07 later mechanism note | `IMP07_IMPLEMENTATION_PLAN.md` (outbox “mechanism later”) |
| Imp-09 depends Imp-10 sequencing | `implementation-09/BLOCKER_REPORT.md` |
