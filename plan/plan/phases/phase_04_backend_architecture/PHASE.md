# ⚠️ SUPERSEDED — Do not execute as current Phase 4

**Current Backend Architecture:** `../phase_07_backend_architecture_design/`  
See `SUPERSEDED.md`. Historical content below.

---

# Phase 04 — Backend Architecture Design (HISTORICAL — migration 1:1)

> Align with **old** Master Plan Phase 4.  
> **Status: Superseded.** Scaffold Partial only.  
> **Blocked on (historical):** Phase 3 Done + Phase 2 Gate (confirmed Database SoT).

## Objective

Chốt ADR Express modular + PostgreSQL + Compose thay PostgREST/Edge — **không** implement nghiệp vụ API trong phase này ngoài refine scaffold nếu ADR yêu cầu.

## Must not assume

- Production Database đã verified chỉ vì có Verified Dump hzppst hoặc scaffold `/health`.  
- ADR inputs must use **post-Gate** SoT (`SOURCE_OF_TRUTH_DECISION.md` closed).

## Inputs

| Input | Required state |
|---|---|
| Phase 3 deliverables | Domain + rule owners Done |
| `frontend-supabase-usage.md` | Available |
| `migration-readiness.md` + `MIGRATION_READINESS_REVIEW.md` | Reviewed |
| Confirmed Database SoT | Phase 2 Gate Done |
| `api-chantier/` scaffold | Exists (Partial) |

## Outputs / Deliverables

- Architecture ADR (modules, layers, errors, transactions)
- FE/Edge/RPC → HTTP endpoint map
- Migration runner decision
- Realtime replacement strategy
- Observability / audit / rollback hooks (design)
- Compose runbook as standard path

## Tasks (not executed)

| ID | Title | Type | Notes |
|---|---|---|---|
| P4-T01 | Express modular skeleton + Docker | Design/Impl | Scaffold already Partial — ADR still required |
| P4-T02 | Postgres access / transactions / migration runner | Design | |
| P4-T03 | Map FE/Edge/RPC → HTTP | Design | |
| P4-T04 | Observability / audit / rollback hooks | Design | |
| P4-T05 | Realtime replacement strategy | Design | |

## Entry Criteria

- [ ] See `PREREQUISITE_CHECKLISTS.md` Phase 4  
- [ ] Phase 3 Exit met  
- [ ] Human starts Phase 4  

## Exit Criteria

- [ ] ADR approved  
- [ ] Every pattern in `frontend-supabase-usage.md` has target module  
- [ ] Realtime strategy recorded  
- [ ] Compose = canonical run path  
- [ ] Gates `04_GLOBAL_GATES.md` for Design  
- [ ] Scaffold ≠ marked Architecture Done without ADR  

## Required Evidence

ADR file path; endpoint map; decision_log rows for migration tool + realtime.

## Rollback Strategy

Reject ADR; retain scaffold; no production impact.

## Decision Points

Migration tool; error model; one write-path validate; poll vs WS/SSE.

## Dependencies

- Hard: Phase 3 Done; Phase 2 Gate Done  
- Soft: Scaffold may exist earlier (already does)  

## Out of Scope

Implementing non-health business endpoints as Phase 4 “Done”; Super Admin; using unverified dump as prod architecture truth.
