# IMP09_FE_REALTIME_CONTRACT_REPORT

**Date:** 2026-07-14  
**Type:** Evidence-only FE realtime contract reverse (no transport selection, no code)  
**Sources:** `chantier1/` frontend, `migration-analysis/` (SUMMARY, business-flows, FLOW_CONTRACTS, realtime_mapping, frontend-supabase-usage)

**Strict:** This report does **not** choose SSE / WebSocket / PG NOTIFY / Outbox / any Unified transport.

---

## 1. Executive Summary

| Fact | Evidence |
|---|---|
| Screens with **Postgres Realtime** (`postgres_changes`) | **Exactly 3:** timesheet, validation, chef-dashboard |
| Screens searched with **no** table realtime | export, user-payroll, management, admin-users, ouvrier-dashboard (no matches), declare-day* |
| Auth subscription (not table realtime) | `AuthContext` `supabase.auth.onAuthStateChange` |
| Client library | Single `createClient` in `services/supabase.ts` |
| React Query / invalidateQueries | **Not used** in this FE |
| Polling | timesheet + validation = **35_000 ms**; chef-dashboard = **no** poll |
| On event behavior | Debounced or immediate **full reload** of screen data from PostgREST — **not** row-level cache merge of payload |
| Timesheet special merge | After reload, preserve local unsaved `new-*` draft lines |
| Flow docs citing realtime | SUMMARY L54; Flow E L81; realtime_mapping; FLOW_CONTRACTS D/E “events” |

**Imp-09 coding:** still **not authorized** by this report.  
**Transport decision:** **not made** here.

---

## 2. Business Requirement

### 2.1 Functions that use table realtime (evidence-backed)

| Function | Screen / file | Business flow | Why realtime (from code + docs) | If realtime lost |
|---|---|---|---|---|
| Worker timesheet live refresh | `app/(tabs)/timesheet.tsx` | Flow D (record time) — SUMMARY “Ouvrier → periodes”; FLOW_CONTRACTS D “events” | See external or own-row changes / chef sync without manual refresh | Poll **35s** + AppState `active` reload still present; UX lag up to ~35s; draft merge still applies on poll |
| Weekly validation queue | `app/(tabs)/validation.tsx` | Flow E — `business-flows.md` L81 “Realtime subscription declarations/periods” | Comment L106–107: “Soft refresh if Realtime misses events (web/network).” Migration comment: new lines without manual refresh | Poll **35s** + AppState; same lag |
| Chef pending team dashboard | `app/(tabs)/chef-dashboard.tsx` | Flow E chef path / SUMMARY chef validate | Reload team pending when teammate period changes | **No poll** in file → until remount/focus/`loadDashboardData` call after local actions, list may stay stale |

### 2.2 Functions that do **not** use table realtime (negative evidence)

| Function | File(s) | Evidence of absence |
|---|---|---|
| Export / payroll export screen | `export.tsx` | No `.channel` / `postgres_changes` / `setInterval` (grep) |
| User payroll detail | `user-payroll.tsx` | `useFocusEffect` → `loadDeclarations` only; no channel |
| Management / administration | `management.tsx`, `admin-users.tsx` | No postgres_changes usage in app grep inventory |
| Declare-day flows | `declare-day*.tsx` | No channel in realtime grep set |
| “Notifications” product (email/push UI) | — | No dedicated notification screen/subscription in inventory |

### 2.3 SoT cross-reference

| Doc | Statement |
|---|---|
| `SUMMARY.md` L22 | FE uses PostgREST + realtime + 2 Edge Functions |
| `SUMMARY.md` L54 | “Realtime: FE lắng nghe periods/declarations” |
| `SUMMARY.md` L122 | Warns broken sync → “realtime chef sai” |
| `business-flows.md` L81–87 | Flow E starts with realtime subscription then SELECT/UPDATE |
| `FLOW_CONTRACTS.md` D/E | “adapters and events” as compatibility |
| `realtime_mapping.md` | Maps three screens only |

---

## 3. Realtime Inventory

### 3.1 Client bootstrap

| Item | Detail | Evidence |
|---|---|---|
| Client | `export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: ... })` | `services/supabase.ts` L8–14 |
| Auth realtime | `onAuthStateChange` → session/profile load | `contexts/AuthContext.tsx` L38–50; cleanup `subscription.unsubscribe()` |
| Table realtime elsewhere | Only three tab screens (below) | Section 3.2 |

### 3.2 Screen inventory table

| Screen | File | Setup function | Realtime? | Poll? | Tables | Filter | Reconnect / status | Cleanup | Purpose |
|---|---|---|---|---|---|---|---|---|---|
| Timesheet | `timesheet.tsx` | `useFocusEffect` callback | Yes `postgres_changes` | Yes 35s | `periodes_travail`, `declarations_heures` | `user_id=eq.${profile.id}` | `subscribe((status,err)=>…)` logs SUBSCRIBED / CHANNEL_ERROR in `__DEV__` | clear debounce/poll; `AppState` remove; `removeChannel` | Reload week entries when own periods/decls change |
| Validation | `validation.tsx` | `useFocusEffect` | Yes | Yes 35s | `declarations_heures`, `periodes_travail` | **None** on channel | Same status logging | Same pattern | Soft-reload weekly validation data |
| Chef dashboard | `chef-dashboard.tsx` | `useFocusEffect` | Yes | **No** | `periodes_travail` | No channel filter; **handler** filters `teamMemberIdsRef` | `.subscribe()` no status callback | `removeChannel` | Reload dashboard if change is for team member |
| Export | `export.tsx` | — | No | No | — | — | — | — | N/A |
| User payroll | `user-payroll.tsx` | focus load | No | No | — | — | — | — | Demand load |
| Auth | `AuthContext.tsx` | `useEffect` | Auth events only | No | — | — | — | `unsubscribe()` | Session lifecycle — **not** periods/declarations contract |

**Not found in FE app:** `useQuery`, `queryClient.invalidateQueries`, `broadcast`, `presence`, `EventSource`, custom `WebSocket`.

---

## 4. Subscription Matrix (contract)

| Screen | Subscribe tables | Channel filter | Client-side extra filter | Events |
|---|---|---|---|---|
| Timesheet | `periodes_travail`, `declarations_heures` | `user_id=eq.{self}` | — | `event: '*'` (INSERT+UPDATE+DELETE) |
| Validation | `declarations_heures`, `periodes_travail` | none | relies on RLS + `loadDeclarations` query scope | `*` |
| Chef dashboard | `periodes_travail` | none | `payload.new/old.user_id` ∈ `teamMemberIdsRef` | `*` |

---

## 5. Polling Matrix

| Screen | Poll? | Interval | Comment in source | Also |
|---|---|---|---|---|
| Timesheet | Yes | `TIMESHEET_POLL_MS = 35_000` | Merge comment mentions “realtime/poll refreshes” L198 | AppState `active` → `loadWeekEntries` |
| Validation | Yes | `VALIDATION_POLL_MS = 35_000` | L106–107: Soft refresh if Realtime misses events | AppState `active` → silent reload |
| Chef dashboard | **No** | — | — | Manual/`loadDashboardData` after local actions (e.g. L277, L305) |
| Export / payroll / management | No | — | — | — |

**Retry:** No dedicated realtime reconnect loop beyond Supabase client subscribe + focus effect remount.  
**CHANNEL_ERROR:** logged in `__DEV__` on timesheet/validation; no alternate transport switch in code.

---

## 6. Event Matrix — Frontend behavior (what code does)

| Screen | On postgres_changes | Debounce | State update strategy |
|---|---|---|---|
| Timesheet | `scheduleReloadFromRealtime` → `loadWeekEntries()` | 400 ms | Full SELECT rebuild of week `entries`; then merge keep `id.startsWith('new-') && statut==='draft'` lines |
| Validation | `scheduleReloadFromRealtime` → `loadDeclarations({ silent: true })` | 400 ms | Full reload of weekly declarations into `weeklyData` (silent skips loading spinner) |
| Chef dashboard | If team member id matches → `loadDashboardData(profile.id)` | **None** | Parallel reload team members, chantiers, pending periods |

**Does not (evidence):** append from `payload.new`, patch single row from payload, or invalidate React Query cache (RQ absent).

### Semantic events implied by FE refresh needs (for Part 7)

Derived only from: tables listened + screens + Flow D/E writes that change those tables.

| Semantic (for human later) | Driven by FE listen on | Typically caused by (CVL flows; not Imp-09 transport) |
|---|---|---|
| Period row changed (any) | timesheet / validation / chef | Worker CRUD; sync from declaration; period decide |
| Declaration row changed | timesheet / validation | Sync from periods; review approve/reject/cancel/annulee; auto-approve |
| Review queue material change | validation | soumise inserts/updates; decisions |
| Chef pending material change | chef-dashboard | teammate period inserts/updates |

---

## 7. Backend Responsibilities (event **semantics** only)

Backend (or future Unified module) must eventually make the **frozen FE** able to refresh when the following **domain facts** change—without this report specifying how:

1. **Period Updated** — any durable change to `periodes_travail` visible to subscriber scope.  
2. **Declaration Updated** — any durable change to `declarations_heures` visible to subscriber scope.  
3. **Decision Approved / Rejected / Returned / Cancelled** — declaration (and often period) status transitions from Flow E.  
4. **Soft Annulee / empty-day cancel** — declaration `annulee` and/or period deletion/sync outcomes.  
5. **Review Queue Changed** — set of `soumise` (and related) rows used by validation UI.  
6. **Chef Pending Changed** — pending periods for supervised team members.

**Out of FE realtime contract (no subscription):** payroll export aggregation refresh, management user CRUD live push, push-notification products.

**Do not map these to SSE/WS/NOTIFY here.**

---

## 8. Transport Requirements (requirements only — no technology)

Derived from FE contract behavior as written:

| Requirement | From evidence |
|---|---|
| Server → client signal when period/declaration rows change | subscriptions + reload |
| One-way push toward client is sufficient for table contract | handlers only reload; no client realtime publish of domain rows |
| Client → server realtime channel for domain data | **Not required** by these screens (writes use PostgREST/REST) |
| Broadcast (Supabase Broadcast API) | **Not used** |
| Presence | **Not used** |
| Scoped delivery | Timesheet: self `user_id`; Chef: client team filter; Validation: no channel filter (RLS/query) |
| Ordering / exactly-once | Not encoded in FE (reload is idempotent) |
| Replay / persistence of events | Not required by FE (full reload) |
| Offline recovery | Poll + AppState partially compensate for timesheet/validation only |
| Acknowledgement | Not in FE |
| Authentication | Uses logged-in Supabase session client |
| Reconnect | Relies on client/`useFocusEffect` lifecycle; CHANNEL_ERROR only logged |
| Fan-out | Multiple clients may subscribe; FE does not implement fan-out logic |

---

## 9. Decision Inputs

### DR-IMP09-001 Evidence (transport for Unified)

| Field | Content |
|---|---|
| **Question** | What transport should Unified Imp-09 use for FE-compatible live refresh? |
| **Known facts** | CVL FE uses Supabase `postgres_changes` on periods/declarations; hybrid 35s poll on timesheet+validation; chef has no poll; export/management have no table realtime; reload-on-signal UX |
| **Unknown facts** | Whether live runtime DB publication includes the two tables (`afgveikz` undumped; `hzppst` dump empty — C-06); what Human picks for Unified replacement |
| **Evidence** | This report §§2–6; `realtime_mapping.md`; FE sources; dump inventory |
| **Possible options** | (list only) keep Supabase Realtime until Imp-12; SSE; WS; domain-bus-only; poll-only backend; defer to Imp-12 adapters — **no selection here** |
| **Trade-offs** | Inventing transport vs FE freeze; chef has no poll so weaker if push missing; Merge Spec defers mechanism |

### DR-IMP09-002 Evidence (emit from Time Recording / Imp-06)

| Field | Content |
|---|---|
| **Question** | How do period/declaration **write** paths emit signals without thawing Imp-06? |
| **Known facts** | Timesheet & chef depend on period/declaration changes from worker writes and sync; Imp-06 frozen; Imp-07 emits in-process only on **review** decisions |
| **Unknown facts** | Whether Imp-09 may patch Imp-06; whether Imp-12 can stay on Supabase WAL without Unified emit |
| **Evidence** | timesheet/chef subscriptions; Imp-07 `notificationHooks.js` (review-only); Imp-06 freeze policy |
| **Possible options** | thaw Imp-06 emit; defer write emits; DB publication only while on Supabase; etc. — **no selection** |
| **Trade-offs** | Incomplete live parity vs freeze discipline |

### DR-IMP09-003 Evidence (Imp-07 hooks ownership)

| Field | Content |
|---|---|
| **Question** | Should Imp-09 own / relocate Imp-07 `notificationHooks`? |
| **Known facts** | Imp-07 has in-process `emitReviewEvent` after approve/reject/return/cancel/period decide; not a FE transport |
| **Unknown facts** | Allowed Imp-07 edit scope under freeze |
| **Evidence** | `api-chantier/.../notificationHooks.js`, `reviewDecision.js` |
| **Possible options** | subscribe-only; move ownership; duplicate — **no selection** |
| **Trade-offs** | Dual owners vs frozen Imp-07 |

---

## 10. Open Questions

1. Live `afgveikz` (or CI) `pg_publication_tables` membership?  
2. Product: is chef-dashboard critical without poll (no FE fallback)?  
3. Human UNIFIED_TRANSPORT choice?  
4. Imp-06 thaw policy for write-path emits?  
5. Is Imp-09 catalog-only allowed before transport?

---

## 11. Recommendation for Human Decision

1. Treat this document as **FE contract evidence pack** for DR-IMP09-001 — **not** as a transport award.  
2. Record CVL usage facts in Decision Log without selecting SSE/WS/NOTIFY/Outbox.  
3. Close Unified transport only after answering Open Questions 1–3.  
4. Keep Imp-09 **BLOCKED** for coding until that Decision Log row exists.  
5. Optionally authorize **Imp-11** in parallel (no Imp-09 dependency).

---

## Appendix A — Negative search outcomes

| Pattern | Result in FE app sources |
|---|---|
| `postgres_changes` / `.channel(` | Only timesheet, validation, chef-dashboard |
| `setInterval` for data refresh | timesheet, validation |
| `@tanstack/react-query` / `invalidateQueries` | Not present |
| `broadcast` / `presence` | No app matches |
| Export/management realtime | None |

## Appendix B — Key source pointers

| Topic | Path |
|---|---|
| Timesheet RT+poll | `chantier1/.../app/(tabs)/timesheet.tsx` L97–98, L195–288 |
| Validation RT+poll | `.../validation.tsx` L106–108, L278–331 |
| Chef RT | `.../chef-dashboard.tsx` L40–64 |
| Client | `.../services/supabase.ts` |
| SoT map | `migration-analysis/merge/realtime_mapping.md` |

**End of report. No transport chosen. No code changed.**
