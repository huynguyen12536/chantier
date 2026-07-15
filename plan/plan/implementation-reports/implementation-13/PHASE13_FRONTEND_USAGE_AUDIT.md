# PHASE13_FRONTEND_USAGE_AUDIT.md

**Date:** 2026-07-15  
**Mode:** Evidence-only Frontend Usage Audit — **no code, no design**  
**FE root:** `chantier1/Chantier-web-app-main/Chantier-web-app-main/`  
**Method:** Full-tree ripgrep + file inspection of every hit  

---

## 1. Client bootstrap (evidence)

| File | Code | Endpoint / feature |
|---|---|---|
| `services/supabase.ts` | `createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })` | Hosted Supabase project base URL + anon key; session persistence via supabase-js defaults |
| `app.config.js` | Hardcodes `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` into `extra` | Injects cloud project into Expo runtime |
| `.env.example` | Same two vars + `EXPO_FORCE_WEBCONTAINER_ENV` | Documented local override (optional) |

No other `createClient` in app runtime (Edge Deno clients are server-side under `supabase/functions/`).

---

## 2. Totals (app runtime, excluding Deno Edge implementations & Array.from)

| Category | Count | Evidence basis |
|---|---|---|
| `.from('<table>')` call sites | **108** | Sum of per-file ripgrep counts for `.from('…')` / `.from("…")` in app/services/utils/contexts/components |
| Auth API call sites | **11** | Listed in auth audit |
| Raw `fetch` to Edge | **5** call sites (4 UI + 1 script) | management ×2, admin-users ×2, `scripts/create-test-users.ts` ×1 |
| `functions.invoke` | **0** | No matches |
| Active `.rpc(` | **2** | management, admin-worksites |
| Commented `.rpc(` | **1** | ouvrierDeclaration `auto_approve_week_suggestion_replication` |
| `.channel(` + `postgres_changes` | **3 screens** | timesheet, validation, chef-dashboard |
| `.storage` | **0** | No matches |
| WebSocket API outside supabase-js | **0** | Realtime only via supabase channel |

Edge Deno sources also contain `.from` / admin auth (**not FE UI**).

---

## 3. Index of audit siblings

| Doc | Content |
|---|---|
| `PHASE13_SUPABASE_USAGE_MATRIX.md` | File × feature × replacement candidate |
| `PHASE13_POSTGREST_AUDIT.md` | Every table op + filter features |
| `PHASE13_AUTH_USAGE_AUDIT.md` | Auth / session / storage of credentials |
| `PHASE13_REALTIME_USAGE_AUDIT.md` | Channels / tables / events |
| `PHASE13_EDGE_RPC_AUDIT.md` | Edge fetch + RPC |
| `PHASE13_FIELD_MAPPING_AUDIT.md` | FE types vs Unified DTO |
| `PHASE13_FE_TO_BACKEND_MATRIX.md` | READY / Needs FE / Needs compat / Blocked DR / Dead / Out |
| `PHASE13_ENV_AUDIT.md` | Env vars Remove / Replace / Keep |

---

## 4. Files that touch Supabase client (app)

| Path | Role |
|---|---|
| `services/supabase.ts` | Client |
| `services/auth.ts` | AuthService helpers (UI primarily uses AuthContext) |
| `services/periods.ts` | Period CRUD helpers |
| `services/worksites.ts` | Affectation helpers |
| `contexts/AuthContext.tsx` | Session + worksite bootstrap |
| `utils/team.ts` | Chef scope helpers |
| `utils/worksiteCode.ts` | Code suggest |
| `utils/ouvrierDeclaration.ts` | Habit / replicate week |
| `components/ouvrier/ChooseDayCalendar.tsx` | Calendar dots |
| `app/declare-day.tsx` | Multi-day declare |
| `app/declare-day-suggestion.tsx` | Suggestion accept |
| `app/declare-day-empty.tsx` | Empty day periods |
| `app/(tabs)/timesheet.tsx` | Timesheet + realtime |
| `app/(tabs)/ouvrier-dashboard.tsx` | Week dashboard |
| `app/(tabs)/chef-dashboard.tsx` | Chef pending + realtime |
| `app/(tabs)/validation.tsx` | Validate/reject/cancel + realtime |
| `app/(tabs)/export.tsx` | Payroll export SELECT |
| `app/(tabs)/user-payroll.tsx` | Payroll detail SELECT |
| `app/(tabs)/management.tsx` | Admin management + Edge + RPC |
| `app/(tabs)/admin-users.tsx` | Users + Edge |
| `app/(tabs)/admin-worksites.tsx` | Worksites + RPC |
| `app/(tabs)/worksite-detail.tsx` | Site detail assign |
| `app/(tabs)/team-management.tsx` | Zones CRUD |
| `app/(tabs)/profile.tsx` | Calls `signOut` via context only (no direct supabase) |
| `scripts/create-test-users.ts` | Dev script Edge fetch |

**Not Supabase:** `services/biometricAuth.ts` uses `expo-secure-store` for **email/password PIN credentials**, not JWT. `i18n` uses `localStorage` for language only.

---

## 5. STOP

This pack is evidence for Human Review before Design. No recommendations beyond classification of facts in matrices.
