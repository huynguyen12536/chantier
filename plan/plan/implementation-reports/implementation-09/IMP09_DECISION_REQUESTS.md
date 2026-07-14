# IMP09_DECISION_REQUESTS — Notifications blocked

**Date:** 2026-07-14  
**Module:** Imp-09  
**Gate:** Implementation **STOP** until Human/Product answers  
**Rule:** Do not invent transport or bypass frozen Imp-06/07/08.

Related open conflict: **C-06** (`conflict_register.md`) — frozen FE realtime compatibility.  
Merge handling: Realtime = **Keep as contract / Defer mechanism**.

---

## DR-IMP09-001 — Notification transport for Unified Platform

### Context
FE (frozen) uses Supabase `postgres_changes` on `periodes_travail` / `declarations_heures`.  
Dump `hzppst` has **empty** `supabase_realtime` publication; repo migration added tables — CVL drift, not license to drop the contract.  
ADR-001: Notification = contract-equivalent events; **transport selected later**.  
Imp-09 DoD asks for transport “selected by implementation evidence” — **no evidence picks a winner**.

### Question
What transport must Imp-09 implement **now** (without FE changes)?

### Options

| ID | Option | Pros | Cons |
|---|---|---|---|
| **A** | **SSE** (`GET /api/notifications/stream`) scoped by JWT + role | Simple HTTP; FE-ready later via Imp-12 adapter | Not what FE uses today; Imp-12 still required for frozen FE |
| **B** | **WebSocket** channel API mirroring screen channel names | Closer shape to FE channels | Invented protocol details; Imp-12 still required |
| **C** | **Outbox table + poll API** (`GET /api/notifications?since=`) | Additive DB; no long-lived sockets; testable | Invents poll contract; FE still on Supabase until Imp-12 |
| **D** | **Domain event bus only (in-process + structured logs); transport deferred to Imp-12** | Matches “Defer mechanism”; zero invented client protocol | Imp-09 does not deliver live FE updates until Imp-12 |
| **E** | Re-enable / emulate **Supabase Realtime publication** on Unified PG | Maximum FE compatibility without FE edit | Heavy platform choice; may need infra not in Wave 2 scope |

### Recommendation (non-binding)
**D** if Wave 2 stays backend-first and Imp-12 owns FE cutover adapters;  
**A or C** if Imp-09 must expose a consumable API before Imp-12.

### Blocking effect
Cannot implement Imp-09 delivery path without choice.

---

## DR-IMP09-002 — Emitting Time Recording (Imp-06) change events

### Context
CVL events N1/N3 require notifications when **periods/declarations** change on worker write / sync (Imp-06).  
Imp-06 is **frozen**. Imp-07 already emits in-process on **human review** only.  
Forbidden: SQL business triggers; silent Imp-06 edits; inventing reads-as-events without authority.

### Question
How may Imp-09 obtain Time Recording change signals?

### Options

| ID | Option | Pros | Cons |
|---|---|---|---|
| **A** | **Thaw Imp-06** minimally: call Notification publisher after period CUD / declaration sync / auto-approve | Completes CVL emit surface | Violates current “do not modify Imp-06” unless explicitly authorized |
| **B** | Imp-09 ships **publisher API**; Imp-06 stay frozen; only Imp-07 events live until Imp-06 thaw | Respects freeze | Timesheet/chef live updates incomplete for Worker writes |
| **C** | **PostgreSQL NOTIFY** via additive persistence hook / advisory layer without “business trigger” | Decouples | Risk of looking like forbidden business SQL; needs Architecture approval |
| **D** | Defer period/declaration write events to **Imp-10/Imp-12**; Imp-09 only catalogs + review bridge | Clear freeze | Partial Imp-09 vs WAVE2 acceptance text |

### Recommendation (non-binding)
**B** or **D** under current freeze; authorize **A** if live parity for declare-path is mandatory in Imp-09.

### Blocking effect
Without A (or equivalent), Imp-09 cannot claim full realtime_mapping parity.

---

## DR-IMP09-003 — Ownership of Imp-07 `notificationHooks.js`

### Context
Imp-07 contains `notificationHooks.js` + `emitReviewEvent` (post-commit).  
Unified Domain: **Notification BC** should own contract-equivalent events.  
Instruction: do not modify Imp-07 unless Imp-09 is blocked.

### Question
How should Imp-09 relate to existing Imp-07 hooks?

### Options

| ID | Option | Pros | Cons |
|---|---|---|---|
| **A** | Imp-09 **subscribes only** to Imp-07 hooks (no Imp-07 edit) | Freeze-safe | Dual ownership smell; catalog split |
| **B** | **Move** emit API into Imp-09; Imp-07 calls Imp-09 (small Imp-07 edit) | Single owner | Requires explicit Imp-07 thaw for wiring |
| **C** | Leave Imp-07 hooks as temporary; Imp-09 re-implements parallel bus | Avoids Imp-07 edit | Duplicate / drift risk |

### Recommendation (non-binding)
**A** until freeze lifted; then **B**.

---

## Required Human answers

| DR | Choose |
|---|---|
| DR-IMP09-001 | A / B / C / D / E |
| DR-IMP09-002 | A / B / C / D |
| DR-IMP09-003 | A / B / C |

After answers are recorded in Decision Log, Imp-09 implementation may resume.

---

## Explicitly not done (this stop)

- No `modules/notifications` code  
- No migration  
- No new REST/SSE/WebSocket  
- No Imp-05/06/07/08 modifications  
