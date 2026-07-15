# PHASE13_IMPLEMENTATION_PLAN.md

**Date:** 2026-07-15  
**Mode:** Design  
**Gate:** Human seal DR-P13-001…009 + authorize coding  

---

## Goal

Ship a local runnable product with frozen UI behavior preserved as far as sealed DRs allow, without domain rewrites.

---

## Work packages (summary)

See `PHASE13_IMPLEMENTATION_SEQUENCE.md` for ordered packages WP0–WP8.

| WP | Theme | Testable outcome |
|---|---|---|
| WP0 | Env + Compose smoke | API health; FE loads against local URL |
| WP1 | Seed | Login as seeded admin |
| WP2 | Auth FE + `/auth/v1` | Login/refresh/logout/profile |
| WP3 | Edge/RPC point to local | create-user / cascade on local |
| WP4 | Table client + allow-list | CRUD periodes/chantiers smoke |
| WP5 | Mappers + composers | AuthContext worksites; hours fields |
| WP6 | Declarations → Imp-07 | validation approve/reject/cancel |
| WP7 | SSE FE | timesheet/validation/chef invalidate |
| WP8 | Hardening + docs | Full smoke A–G subset; runbook |

---

## FE modification scope (exact file list — design)

**Must touch (DR-P13-001=A):**

| File | Change |
|---|---|
| `services/supabase.ts` | Replace or deprecate; add `services/apiClient.ts` / `services/session.ts` |
| `contexts/AuthContext.tsx` | `/auth/v1` + session store; drop supabase auth |
| `app.config.js` / `.env.example` | `EXPO_PUBLIC_API_URL`; remove cloud hardcode |
| `services/auth.ts` | Align with new session or delete unused paths |
| `services/periods.ts` | Use apiClient |
| `services/worksites.ts` | Use apiClient |
| `utils/team.ts` | Use apiClient / composers |
| `utils/worksiteCode.ts` | Use apiClient |
| `utils/ouvrierDeclaration.ts` | Use apiClient; leave commented RPC dead |
| `components/ouvrier/ChooseDayCalendar.tsx` | apiClient |
| `app/declare-day.tsx` (+ suggestion/empty) | apiClient |
| `app/(tabs)/timesheet.tsx` | apiClient + SSE (drop channel) |
| `app/(tabs)/ouvrier-dashboard.tsx` | apiClient |
| `app/(tabs)/chef-dashboard.tsx` | apiClient + SSE |
| `app/(tabs)/validation.tsx` | apiClient + decision mapping + SSE |
| `app/(tabs)/export.tsx` | apiClient |
| `app/(tabs)/user-payroll.tsx` | apiClient |
| `app/(tabs)/management.tsx` | apiClient; Edge URL from API_URL; POST not upsert |
| `app/(tabs)/admin-users.tsx` | Edge URL from API_URL |
| `app/(tabs)/admin-worksites.tsx` | apiClient + RPC path |
| `app/(tabs)/worksite-detail.tsx` | apiClient |
| `app/(tabs)/team-management.tsx` | apiClient / zone composer |
| `app/(auth)/login.tsx` | Only if imports supabase directly (via context today) |

**May touch:** `package.json` (remove `@supabase/supabase-js` when unused).

**Do not touch for MVP:** UI layout components, i18n copy, biometric SecureStore email/password (still calls new signIn).

---

## Backend modification scope (exact)

**Under `api-chantier/src/modules/compat/` only (+ optional seed script):**

| Area | Change |
|---|---|
| `compat/tables/*` | Allow-list query parsing; composers; hour mapper; declarations PATCH→Imp-07 |
| `compat/mappers/*` | New mappers as listed |
| `compat/index.js` | Mount only if new routers |
| `scripts/seed-local.js` or `src/db/seed.js` | Seed (not business module) |
| Tests | `test/compat.phase13*.test.js` (when coding authorized) |

**Do not modify:** Imp-02…11 `service.js` / repos / migrations schema (except if Human later forces hours migration — Design rejects).  
**Do not modify:** Imp-09 core publish logic (FE consumes existing `/events`).  
**Docker:** docs/env examples only unless Human authorizes compose doc scripts — Design prefers no topology change (api+db already).

---

## Ownership rules for implementers

1. Adapters call services only.  
2. No `query()` in new compat code except **forbidden** — use services.  
3. Declarations statut only via Imp-07.  
4. No Realtime bridge module.  

---

## Out of MVP

Imp-08 FE switch; Super Admin; ETL; Redis; MinIO; full PostgREST; production DNS TLS.
