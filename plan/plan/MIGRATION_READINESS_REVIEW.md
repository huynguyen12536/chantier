# Migration Readiness Review

> **ADDENDUM 2026-07-14:** Project = Consolidation + Replatforming.  
> Table statuses below = readiness for **Legacy labeling / historical migrate path**.  
> **Consolidation readiness** = `PROJECT_EXECUTION_READINESS.md` + Merge Spec Gate (System B).  
> “Promote Database SoT” ≠ Unified Backend SoT.

**Date:** 2026-07-14  
**Type:** Review only — **does not** change `migration-readiness.md` factual RE status.  
**Phase 2:** Technical Investigation Complete · Waiting External Confirmation

Legend: **Ready** = enough evidence to work after Gate · **Waiting** = blocked on External Confirmation / human decision · **Blocked** = missing evidence that prevents safe progress

---

## A. Source of Truth & Environment

| Item | Status | Notes |
|---|---|---|
| FE committed Runtime URL (`afgveikz`) | Ready | Phase 1 evidence |
| Verified Dump (`hzppst`) | Ready | Schema-only artifacts exist |
| Runtime DB == Dump DB | Waiting | C05 ~10% — External Confirmation |
| Production VM / CI secret URL | Waiting | Opaque secrets |
| Promote Database SoT | Waiting | Scenario A/B/C |
| Environment label (prod/staging/…) | Waiting | Unclassified |
| Dump afgveikz | Waiting / Blocked | Needs credentials; failed prior attempt |

---

## B. Schema & Constraints

| Item | Status | Notes |
|---|---|---|
| Table inventory (8 public) | Ready* | *on hzppst Verified Dump + migrations docs |
| Views / indexes / FKs / CHECKs | Ready* | Re-confirm on Runtime SoT after Gate |
| Sequences | Ready | None (uuid) |
| Extensions | Ready* | On hzppst dump |
| schema_migrations trust | Blocked | Only 5 rows on hzppst vs rich objects — use dump inventory |
| Wave A+B repo replay as prod truth | Blocked | Do not replay blind |

---

## C. Triggers & Functions

| Item | Status | Notes |
|---|---|---|
| 3 app triggers present (hzppst) | Ready* | Re-verify Runtime SoT |
| Auth.users profile hook absent (hzppst) | Ready* | Re-verify Runtime SoT |
| sync body (DELETE vs soft-cancel) | Waiting | Which is Production SoT unknown |
| Hours view (7h vs cadre) | Waiting | Same |
| Repo-only fns (cadre, week RPC) | Waiting | Port/Drop after confirmed DB |
| Keep/Port/Drop signed table | Waiting | Phase 7; needs Gate + product |

---

## D. RLS / AuthZ / Auth

| Item | Status | Notes |
|---|---|---|
| RLS inventory docs | Ready | + hzppst policies dump |
| Policy bug (zone ouvriers INSERT as SELECT) | Ready* | Observed on hzppst; confirm Runtime |
| Zone chef FK CASCADE vs RESTRICT | Waiting | Diff dump vs later migration |
| Edge create/delete rules documented | Ready | auth-flow |
| JWT / password design | Waiting | Phase 5 after P4 |
| Super Admin / multi-company | Ready (out of scope) | Architecture Scope Confirmed |

---

## E. Frontend & Edge surface

| Item | Status | Notes |
|---|---|---|
| FE Supabase usage inventory | Ready | |
| Dead services identified | Ready | |
| Realtime screens listed | Ready | |
| Realtime publication empty on hzppst | Waiting | Confirm Runtime; may be dead |
| Hardcoded anon key | Ready (risk known) | R-08 — fix in later FE phases |

---

## F. Backend scaffold

| Item | Status | Notes |
|---|---|---|
| Express modules + Docker Compose | Ready | Scaffold Partial ≠ Architecture Done |
| `/health` | Ready | |
| Business routes | Blocked | 501; need P4–P9 |
| ADR / endpoint map | Waiting | Needs P3 + Gate |
| Migration runner | Waiting | P4 |

---

## G. Process / Governance

| Item | Status | Notes |
|---|---|---|
| Agentic Flow phases 0–14 defined | Ready | |
| NEXT_ACTION_MATRIX | Ready | |
| Prerequisite checklists P3–14 | Ready | `phases/PREREQUISITE_CHECKLISTS.md` |
| Confidence Matrix | Ready | |
| Phase 3–5 assumption “prod verified” | Ready | Corrected in Phase docs |
| Decision on Scenario A/B/C/D | Waiting | Human |

---

## Summary counts (approximate)

| Ready | Waiting | Blocked |
|---|---|---|
| Documentation, FE inventory, scaffold, Verified Dump, governance prep | Runtime confirmation, SoT promotion, behavior parity choices, ADR/API | Implementing BE business logic; trusting schema_migrations; treating hzppst as prod |

---

## Checklist from `migration-readiness.md` §7 (mapped)

| Checklist item | Status |
|---|---|
| Dump schema production thật | Waiting (Verified Dump ≠ proven Production) |
| Xác nhận afgveikz vs hzppst | Waiting |
| Tenancy decision | Waiting (default single-tenant recorded; confirm) |
| Business rules sign-off | Waiting (needs P3 after Gate) |
| Trigger dual-run strategy | Waiting (P7/P8 after Gate) |
