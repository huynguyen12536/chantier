# IMP09_REALTIME_INVESTIGATION_REPORT

**Date:** 2026-07-14  
**Type:** Evidence-only investigation (no implementation)  
**Goal:** Close or refine **DR-IMP09-001** using facts from migration-analysis, legacy FE repo, SQL migrations, and verified dump.  
**Rule:** No assumptions. No invented transport for Unified Platform.

---

## 1. Executive Summary

| Question | Answer (evidence-backed) |
|---|---|
| What transport does **CVL frontend code** use? | **Supabase Realtime `postgres_changes`** on `periodes_travail` / `declarations_heures` |
| Is there Broadcast / Presence / custom WebSocket / SSE in CVL FE? | **No evidence** in application source |
| Is there client polling? | **Yes** — `setInterval` 35s on **timesheet** and **validation** (hybrid fallback); **not** on chef-dashboard |
| What does **repo SQL** intend for publication? | `ALTER PUBLICATION supabase_realtime ADD TABLE` for **both** `declarations_heures` and `periodes_travail` |
| What does **verified dump `hzppst`** show? | Publication `supabase_realtime` **exists with 0 tables** |
| Was `afgveikz` DB inspected live for this task? | **No** — dump unavailable (`SOURCE_OF_TRUTH_DECISION.md`) |
| Unified Platform replacement transport decided? | **NO** (MERGE Defer mechanism; ADR later; C-06 Open) |
| Can DR-IMP09-001 be fully closed for Imp-09 implementation? | **NO** — CVL client mechanism known; Unified replacement still deferred |
| Can Imp-09 start coding? | **NO** |

**CVL transport classification:** **G — Hybrid** = **A (postgres_changes)** + polling fallback on two screens. Not B/C/D/E/F alone.

---

## 2. Architecture overview (facts)

```
┌─────────────────────────────────────────────────────────────┐
│ Frozen FE (single Expo client → one Supabase URL at runtime)│
│  timesheet / validation / chef-dashboard                    │
│    supabase.channel(...).on('postgres_changes', ...)        │
│    + setInterval poll (timesheet, validation only)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ PostgREST + Supabase Realtime client
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase project (runtime ref afgveikz OR undetermined CI)  │
│  Logical changes on tables (via FE/DB triggers)             │
│  → WAL → supabase_realtime publication (IF tables added)    │
│  → Realtime server → postgres_changes to clients            │
└─────────────────────────────────────────────────────────────┘

Legacy Edge Functions (create-user, delete-user, seed): NO realtime/event forwarding found.
Unified api-chantier: in-process review hooks only; NO client transport.
```

**Important identity fact (O3 / ASSUMPTION A-03):** `afgveikz` and `hzppst` are **CVL environment/repository drift candidates**, not proven separate products. Investigation labels them **Project Runtime-candidate** and **Project Dump-verified**.

---

## 3. Legacy Supabase A — Runtime candidate `afgveikzneaablcuzwdb`

| Item | Fact | Evidence |
|---|---|---|
| Role | Committed FE/EAS Supabase URL + anon JWT `ref=afgveikz…` | `SOURCE_OF_TRUTH_DECISION.md` §1; `app.config.js`; `eas.json` |
| Schema dump available this workspace | **No** | `SOURCE_OF_TRUTH_DECISION.md` §2–5; Phase 2 dump failed |
| Live `supabase_realtime` table list | **Unknown (not inspectable without credentials/dump)** | Same |
| FE client target | Code resolves env → `expo.extra` → this project by default | `services/supabase.ts` (cited in SoT) |
| Dual-client second Supabase | **Not present** in FE | `00-IMPORTANT-FINDINGS.md` Phase 1 validation |

**Cannot assert** whether afgveikz publication currently includes `periodes_travail` / `declarations_heures`.

---

## 4. Legacy Supabase B — Verified dump `hzppsttpzzeuslnpcdkv`

| Item | Fact | Evidence |
|---|---|---|
| Role | CLI-linked verified dump | `SOURCE_OF_TRUTH_DECISION.md` §2; `production-dump/` |
| Used as FE hardcoded runtime? | **No evidence** in committed app URL | SoT §1 vs §2 |
| Publication `supabase_realtime` | **Exists** | `production-dump/05_extra_inventory.txt` L34–40 |
| Tables in `supabase_realtime` | **0 rows** | same file L45–50; `production-vs-repository-diff.md` §10 |
| `periodes_travail` published? | **No** (on this dump) | same |
| `declarations_heures` published? | **No** (on this dump) | same |
| Repo migration `enable_validation_realtime` in dump `schema_migrations`? | **Not listed** among 5 history versions | dump history starts `20260311*` only (`05_extra_inventory.txt`); diff §11 |

**Implication:** On **hzppst dump evidence**, FE `postgres_changes` subscriptions are **not backed by published tables**. Whether live traffic uses a different project (afgveikz) remains **unproven** (C-01 / C-06).

---

## 5. Database realtime investigation

### 5.1 Questions checklist

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Is realtime enabled? | Publication object exists on hzppst; membership empty | dump `05_extra_inventory.txt` |
| 2 | `CREATE PUBLICATION` in inspected dump SQL? | Not found as CREATE text in dump search; publication **present** as inventory row | dump inventory |
| 3 | Which tables published (hzppst)? | **None** | dump L48–50 |
| 4 | `periodes_travail` included (hzppst)? | **No** | dump |
| 5 | `declarations_heures` included (hzppst)? | **No** | dump |
| 6 | SQL triggers sending app notifications? | Sync/auto-approve/business triggers exist in CVL inventory; **no** trigger found whose purpose is push/broadcast to clients | migration-analysis triggers; FE relies on table change → Realtime |
| 7 | `pg_notify` for app events? | Repo migration uses `NOTIFY pgrst, 'reload schema'` only (PostgREST schema reload), **not** app notification channel | `20260512164000_delete_chantier_cascade.sql` L45 |
| 8 | `broadcast()` function? | **No match** in FE/app SQL search | workspace grep |
| 9 | Edge Functions forwarding events? | Edge set = create-user, delete-user, seed-test-users — **no realtime/notify usage** | `supabase/functions/*` |
| 10 | Custom notification tables? | **No evidence** in CVL tables inventory for notif/outbox | tables-used / schema analysis |
| 11 | Event log tables? | **No** dedicated event-log table evidenced for realtime | same |
| 12 | Outbox pattern? | **No** | same |

### 5.2 Repository SQL intent (migrations in FE repo)

| Migration | Action |
|---|---|
| `20260512174500_enable_validation_realtime.sql` | Conditionally `ALTER PUBLICATION supabase_realtime ADD TABLE` `declarations_heures`, `periodes_travail` |
| `20260618071114_enable_validation_realtime.sql` | Idempotent repeat of same ADD TABLE |

Comment in first migration: admin validation screen listens so new lines appear without manual refresh.

### 5.3 afgveikz DB

**Not inspected** in this investigation (no dump credentials in session). Marked **UNKNOWN**.

---

## 6. Frontend subscriptions inventory

Sources: `chantier1/.../app/(tabs)/{timesheet,validation,chef-dashboard}.tsx`.  
Search for `broadcast` / `presence` / `EventSource` / `WebSocket` in FE app code: **0 matches**.

| Screen | Component | Channel name | Table(s) | Filter | Event type | INSERT/UPDATE/DELETE | Broadcast | Presence | Polling fallback | Refresh behavior | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timesheet | `timesheet.tsx` | `timesheet-entries-{profile.id}` | `periodes_travail`, `declarations_heures` | `user_id=eq.{profile.id}` each | `postgres_changes` `event: '*'` | Covered by `*` | No | No | **Yes** `TIMESHEET_POLL_MS = 35000` | Debounced `loadWeekEntries` (400ms); AppState active reload | L97–98, L240–288 |
| Validation | `validation.tsx` | `validation-hebdo-{profile.id\|session}` | `declarations_heures`, `periodes_travail` | **None** (server/RLS filter) | `postgres_changes` `*` | Covered by `*` | No | No | **Yes** `VALIDATION_POLL_MS = 35000` | Debounced `loadDeclarations({silent})`; AppState active | L107–108, L292–330 |
| Chef dashboard | `chef-dashboard.tsx` | `chef_dashboard_{profile.id}` | `periodes_travail` only | No SQL filter; **client filter** `teamMemberIdsRef` | `postgres_changes` `*` | Covered by `*` | No | No | **No** poll in this file | `loadDashboardData` if payload user in team | L45–64 |
| Export / payroll | `export.tsx` | — | — | — | — | — | — | — | No channel | Demand fetch | No `.channel` / `postgres_changes` |

---

## 7. Backend notification inventory

### 7.1 Legacy Edge / SQL “backend”

| Mechanism | Present? | Evidence |
|---|---|---|
| Edge event fan-out | No | functions listed above |
| Custom WS/SSE gateway | No | no FE consumer; no gateway source |
| Business `NOTIFY` channels for UI | No | only `NOTIFY pgrst` |

### 7.2 Unified `api-chantier` (Wave 2, post-CVL)

| Mechanism | Present? | Evidence |
|---|---|---|
| `notificationHooks.js` | Yes | `api-chantier/src/modules/validation/services/notificationHooks.js` |
| `emitReviewEvent` | Yes — after Imp-07 review commit | `reviewDecision.js` imports |
| WebSocket / SSE / `/events` HTTP | **No** | no routes/files |
| Outbox / queue / domain bus product | **No** | freeze; Imp-09 blocked |
| Timesheet write emits | **No** | Imp-06 frozen; no emit in timesheet services |

**Fact:** Unified review hooks log + optional in-process subscribers only. They are **not** a CVL transport and **do not** deliver to frozen FE.

---

## 8. Transport comparison

| Outcome | Matches CVL FE evidence? | Notes |
|---|---|---|
| **A. Supabase postgres_changes** | **YES (primary)** | All three screens |
| **B. Supabase Broadcast** | NO | no `broadcast` usage |
| **C. Supabase Presence** | NO | no `presence` usage |
| **D. WebSocket custom** | NO | none in app source |
| **E. SSE** | NO | none |
| **F. Polling only** | NO | poll is **fallback**, not sole mechanism |
| **G. Hybrid** | **YES** | A + 35s poll on timesheet & validation |
| **H. No realtime at all** | NO | code subscribes; dump may make it ineffective on hzppst |

**Observed CVL client pattern = G (A+poll).**

---

## 9. Evidence matrix

| Claim | Status | Citation |
|---|---|---|
| FE uses `postgres_changes` | Proven | timesheet/validation/chef-dashboard sources |
| FE uses Broadcast/Presence | Absent | grep 0 |
| FE poll 35s timesheet+validation | Proven | constants L97–98 / L107–108 |
| Chef dashboard has poll | Absent | chef-dashboard focus effect |
| Repo adds tables to publication | Proven | enable_validation_realtime migrations |
| hzppst publication empty | Proven | dump + production-vs-repository-diff §10 |
| afgveikz publication membership | **Unknown** | no dump |
| C-06 still Open | Proven | `conflict_register.md` |
| MERGE defers mechanism for Unified | Proven | `MERGE_DECISION_MATRIX.md` L14 |
| ADR transport later | Proven | ADR-001 Notification row |
| `NOTIFY pgrst` ≠ app realtime | Proven | cascade migration comment/context |

---

## 10. Decision matrix (DR-IMP09-001)

| Decision question | Can evidence alone answer? | Result |
|---|---|---|
| What did **CVL FE** implement? | **YES** | Hybrid: Supabase **postgres_changes** + poll fallback (2 screens) |
| What is **hzppst** publication state? | **YES** | Empty membership |
| What is **afgveikz** publication state? | **NO** | Missing dump / live inspection |
| What must **Unified Imp-09** implement as transport **now**? | **NO** | Still deferred by Merge Spec + ADR + C-06; FE frozen cannot switch without Imp-12 |

---

## 11. Recommended Decision Log outcome

### Record as **FACT** (close CVL discovery half of DR-IMP09-001)

> **CVL_REALTIME_FACT:** Current Verified Legacy frontend uses Supabase Realtime **`postgres_changes`** on `periodes_travail` and/or `declarations_heures` (screens: timesheet, validation, chef-dashboard). Timesheet and validation additionally poll every **35s**. No Broadcast/Presence/custom WS/SSE in CVL app source. Repository SQL *intends* both tables on `supabase_realtime`; verified dump `hzppst` has **zero** published tables (C-06 drift). Runtime project `afgveikz` publication membership **unknown**.

### Keep **OPEN** (implementation half)

> **UNIFIED_TRANSPORT:** Choose Unified Platform delivery for Imp-09 / Imp-12 among product options (domain bus only until Imp-12; SSE/WS adapter; re-home Supabase Realtime on Unified PG; etc.). Merge Spec still says **Defer mechanism**. Do **not** treat CVL_FACT as automatic selection of SSE/WS/Outbox.

Until UNIFIED_TRANSPORT is logged, **do not code Imp-09 transport**.

---

## 12. Risk analysis

| Risk | Evidence | Impact |
|---|---|---|
| Realtime dead on dump DB | hzppst 0 tables | FE subscriptions may never fire; poll masks on 2 screens |
| Runtime ≠ dump | SoT C-01 | Wrong publication assumptions if designing only from hzppst |
| Chef has no poll | chef-dashboard source | If publication empty, chef live UI silent until manual focus reload |
| Invent Unified transport | MERGE defer | Architecture drift / FE freeze violation |

---

## 13. Recommended implementation architecture

**Not authorized to implement.** Evidence-only recommendation sketch for Human Decision Log (not code):

1. Preserve **semantic contract**: scoped change signals for periods/declarations matching FE refresh behavior.  
2. Do **not** require FE change in Imp-09.  
3. Prefer deciding:  
   - **Defer client transport to Imp-12** (adapter against frozen Supabase client), **or**  
   - Explicitly select Unified `/events` SSE **or** WS per `FE_COMPATIBILITY_ADAPTERS.md` L18 **only after Decision Log**, **or**  
   - Platform re-enable publication parity if remaining on Supabase temporarily.  
4. Thaw Imp-06 emit (DR-002) only if write-path events required before Imp-12.

---

## 14. Can Imp-09 start?

# **NO**

Reasons:

1. Unified transport not Decision-Logged.  
2. C-06 Open (runtime publication vs dump).  
3. afgveikz publication unknown.  
4. DR-IMP09-002/003 still affect emit surface & ownership.

---

## 15. Required Decision Requests remaining

| DR | Status after this investigation |
|---|---|
| **DR-IMP09-001** | **Partially answered (CVL fact)**; **Unified choice still required** |
| **DR-IMP09-002** | Still OPEN (Imp-06 freeze / emit) |
| **DR-IMP09-003** | Still OPEN (Imp-07 hooks ownership) |
| **C-06 / C-01** | Still OPEN (confirm which project serves live traffic + publication membership) |

**Suggested Human actions (evidence, not code):**

1. Dump or query `afgveikz` `pg_publication_tables` for `supabase_realtime`.  
2. Confirm CI/VM Supabase ref.  
3. Decision Log UNIFIED_TRANSPORT option.  
4. Then authorize Imp-09 scope (transport slice only vs catalog-only).

---

## Appendix — Negative searches (absence is recorded, not invent)

| Pattern | Result in CVL FE app / Edge / inspected dump |
|---|---|
| `broadcast` / `presence` | No app matches |
| `EventSource` / `WebSocket` / `wss://` | No app matches |
| Outbox / event_log tables | No evidence |
| Edge realtime forward | No evidence |
| api-chantier SSE/WS routes | No evidence |

---

**Document status:** Investigation PASS (evidence complete within available artifacts).  
**Implementation status:** Imp-09 remains **BLOCKED**.
