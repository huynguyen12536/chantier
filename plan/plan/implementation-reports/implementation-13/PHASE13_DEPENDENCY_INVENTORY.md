# PHASE13_DEPENDENCY_INVENTORY.md

**Date:** 2026-07-15  
**Mode:** Investigation + **Frontend Usage Audit** (evidence)  
**FE root:** `chantier1/Chantier-web-app-main/Chantier-web-app-main/`  
**Authority for counts:** `PHASE13_FRONTEND_USAGE_AUDIT.md` and sibling audit docs  

---

## 1. Client entrypoint

| Item | Evidence |
|---|---|
| `@supabase/supabase-js` | `services/supabase.ts` `createClient` |
| URL | `EXPO_PUBLIC_SUPABASE_URL` + **hardcoded** `app.config.js` cloud project |
| Anon key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` + hardcoded |
| Auth client options | `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false` |

---

## 2. Quantitative inventory (app FE)

| Category | Count |
|---|---|
| `.from(table)` call sites | **108** |
| Auth API call sites | **11** (see auth audit) |
| Edge raw fetch call sites (UI+script) | **5** |
| `functions.invoke` | **0** |
| Active RPC | **2** (`delete_chantier_cascade`) |
| Commented RPC | **1** |
| Realtime channel screens | **3** |
| Storage | **0** |

---

## 3. Tables touched

`profiles`, `chantiers`, `affectations_chantiers`, `periodes_travail`, `declarations_heures`, `zones_equipe`, `zones_chantiers`, `zones_ouvriers` — eight only.

---

## 4. Auth

| API | Present |
|---|---|
| signInWithPassword | YES |
| signOut local | YES |
| getSession | YES |
| onAuthStateChange | YES |
| refreshSession explicit | NO (autoRefreshFlag only) |
| signUp / getUser in app | NO (getUser in Edge Deno only) |

SecureStore: biometric email/password — not JWT.

---

## 5. Realtime

timesheet, validation, chef-dashboard — `postgres_changes` only; used as reload triggers (+ timesheet also polls).

---

## 6. Edge / RPC

Edge: create-user, delete-user via raw fetch.  
RPC: delete_chantier_cascade active; auto_approve commented.

---

## 7. Imp-12 coverage snapshot

| FE class | Imp-12 |
|---|---|
| Edge / RPC cascade | Delivered |
| Table allow-list verbs | Delivered narrow |
| Auth `/auth/v1` | Delivered thin |
| Declarations UPDATE | Sealed omitted B-003=C |
| Realtime bridge | Sealed omitted B-006=B |
| Upsert invent | Sealed omitted B-005=B |
| PostgREST grammar / embeds | Not delivered |

---

## 8. Related audit pack

See `PHASE13_INVESTIGATION_INDEX.md` § Frontend Usage Audit.
