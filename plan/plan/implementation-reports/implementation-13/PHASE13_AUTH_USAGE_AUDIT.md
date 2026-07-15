# PHASE13_AUTH_USAGE_AUDIT.md

**Date:** 2026-07-15  
**Evidence-only**

---

## 1. Auth APIs searched

| API | Found in FE app? | Locations |
|---|---|---|
| `signInWithPassword` | **YES** | `AuthContext.tsx` ~177; `services/auth.ts` ~6 |
| `signUp` | **NO** | — |
| `getSession` | **YES** | `AuthContext.tsx` ~29, ~77; `management.tsx` ~453,~578; `admin-users.tsx` ~147,~230 |
| `refreshSession` | **NO** (explicit) | Relies on supabase-js `autoRefreshToken: true` in `services/supabase.ts` |
| `signOut` | **YES** | `AuthContext.tsx` ~190 `{ scope: 'local' }`; `services/auth.ts` ~14 same |
| `onAuthStateChange` | **YES** | `AuthContext.tsx` ~38 |
| `getUser` | **NO** in app UI | **YES** in Edge `supabase/functions/delete-user/index.ts` ~37 (`callerClient.auth.getUser`) |
| `auth.admin.*` | **NO** in app | **YES** in Edge create/delete/seed Deno |

---

## 2. Auth context / session flow (evidence)

| Step | File / fn | Call | Purpose |
|---|---|---|---|
| Bootstrap | `AuthProvider` useEffect | `supabase.auth.getSession()` | Restore session |
| Subscribe | same | `onAuthStateChange` | Sync `session` state |
| Login | `signIn` | `signInWithPassword({ email, password })` | Login |
| Logout | `signOut` | Clear React state then `signOut({ scope: 'local' })` | **Local clear only** — no server revoke HTTP |
| Refresh profile | `refreshProfile` | `getSession` then `loadProfile` | Reload profile row |
| Load profile | `loadProfile` | `from('profiles').select('*').eq('id').maybeSingle()` | Profile + worksites |
| Provide | `useAuth()` | Context | Consumers (login, profile, tabs) |

`services/auth.ts` duplicates signIn/signOut/getProfile/updateProfile — **present in codebase**; primary login path observed is AuthContext (login screen uses context).

---

## 3. JWT / session persistence

| Mechanism | Evidence |
|---|---|
| supabase-js `persistSession: true` | `services/supabase.ts` |
| Storage engine | Not customized in code — supabase-js default (AsyncStorage on RN / localStorage on web per library) |
| `detectSessionInUrl: false` | Explicit |
| `autoRefreshToken: true` | Explicit — refresh uses GoTrue refresh endpoints under the hood (no FE call site) |
| Expo SecureStore | `biometricAuth.ts` stores **email + password** for device PIN login — **not** access/refresh tokens |

---

## 4. getSession for Edge Bearer

| File | Purpose |
|---|---|
| `management.tsx` create-user / delete-user | `session.access_token` → `Authorization: Bearer` + `apikey: supabaseAnonKey` |
| `admin-users.tsx` same | same |

---

## 5. Response shape FE expects (login/session)

From `@supabase/supabase-js` `Session` type usage:

- `session.user.id` used as profile id  
- `session.access_token` for Edge Bearer  
- Full Session object kept in React state  

No FE code parses Imp-12 `{ access_token, refresh_token, user }` directly today.

---

## 6. Replacement candidate (fact mapping only)

| FE behavior | Existing backend surface |
|---|---|
| Password login | Imp-12 `POST /auth/v1/token?grant_type=password` → Imp-02 `login` |
| Refresh (client-managed) | Imp-12 `grant_type=refresh_token` → Imp-02 `refresh` |
| Logout revoke | Imp-12 `POST /auth/v1/logout` → Imp-02 `logout` (FE today skips revoke) |
| Current user | Imp-12 `GET /auth/v1/user` → Imp-02 `getProfileById` |
| Profile row | Imp-12 `/tables|/rest/v1/profiles` → Imp-03/11 |
| RBAC enforcement | Imp-02 middleware on Unified routes — FE reads `profiles.role` for UI |

**NO EXISTING REPLACEMENT** for: supabase-js Session object lifecycle / `onAuthStateChange` event bus without FE or GoTrue-parity layer.
