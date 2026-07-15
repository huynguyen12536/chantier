# PHASE13_REALTIME_USAGE_AUDIT.md

**Date:** 2026-07-15  
**Evidence-only**  
**Search:** `.channel(`, `postgres_changes`, `broadcast`, `presence`, `removeChannel`, `unsubscribe`

---

## 1. Features found / not found

| Feature | Present? |
|---|---|
| `.channel(...)` | **YES** — 3 screens |
| `postgres_changes` | **YES** — only event type used |
| `broadcast` | **NO** |
| `presence` | **NO** |
| `removeChannel` | **YES** — cleanup on unmount |
| Raw WebSocket | **NO** outside supabase-js |

---

## 2. Screen inventory

### A. `app/(tabs)/timesheet.tsx`

| Field | Evidence |
|---|---|
| Channel name | `` `timesheet-entries-${profile.id}` `` |
| Handler | `scheduleReloadFromRealtime` → debounced `loadWeekEntries()` |
| Subscription 1 | `postgres_changes` event `*` schema `public` table `periodes_travail` filter `user_id=eq.${profile.id}` |
| Subscription 2 | same for `declarations_heures` filter `user_id=eq.${profile.id}` |
| Also | `setInterval` poll `TIMESHEET_POLL_MS`; AppState `active` reload |
| Cleanup | `supabase.removeChannel(channel)` |

### B. `app/(tabs)/validation.tsx`

| Field | Evidence |
|---|---|
| Channel | dynamic `channelName` (file ~294) |
| Events | two `postgres_changes` on `declarations_heures` and `periodes_travail` (event `*`) |
| Effect | reload validation list |
| Cleanup | `removeChannel` |

### C. `app/(tabs)/chef-dashboard.tsx`

| Field | Evidence |
|---|---|
| Channel name | `` `chef_dashboard_${profile.id}` `` |
| Event | `postgres_changes` on `periodes_travail` (~46–63) |
| Effect | refresh pending team periods |
| Cleanup | `removeChannel` |

---

## 3. Imp-09 SSE comparison (facts only)

| Aspect | FE Realtime today | Imp-09 |
|---|---|---|
| Transport | Supabase Realtime websocket via channel | `GET /events` SSE |
| Payload | postgres_changes row events (used only to trigger reload) | Domain catalog events (scoped) |
| Tables watched | `periodes_travail`, `declarations_heures` | Events emitted after domain mutations |
| Filter | user_id / channel naming | Actor/role scope server-side |

**Observation:** FE does **not** apply row payloads — it **reloads** via PostgREST after any change. Functionally similar to “invalidate + refetch.” SSE could drive the same reload **if** FE listened to `/events` instead of `.channel` — that is an FE transport change (not claimed implemented).

---

## 4. Replacement candidate

| Screen | Candidate |
|---|---|
| All three | Imp-09 `GET /events` (subscribe + refetch) |
| | **NO EXISTING REPLACEMENT** that speaks `postgres_changes` protocol (Imp-12 B-006=B sealed: no Realtime bridge) |
