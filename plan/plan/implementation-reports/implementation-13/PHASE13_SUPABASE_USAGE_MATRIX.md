# PHASE13_SUPABASE_USAGE_MATRIX.md

**Date:** 2026-07-15  
**Evidence-only** — one row class per call pattern (not every line duplicate)

Legend replacement: Imp module / Imp-12 path / **NO EXISTING REPLACEMENT**

---

## Auth

| File | Symbol | Purpose | Call | Feature | Replacement |
|---|---|---|---|---|---|
| `services/supabase.ts` | client | Bootstrap | `createClient` | Client | Imp-12 base host (if kept) / **NO EXISTING** client drop-in |
| `AuthContext.tsx` | effect | Restore session | `auth.getSession` | Auth | Imp-12/02 token+storage — **NO EXISTING** Session API |
| `AuthContext.tsx` | effect | Sync session | `onAuthStateChange` | Auth | **NO EXISTING REPLACEMENT** |
| `AuthContext.tsx` | `signIn` | Login | `signInWithPassword` | Auth | Imp-12 `/auth/v1/token` → Imp-02 |
| `AuthContext.tsx` | `signOut` | Logout local | `signOut({scope:'local'})` | Auth | FE local clear; optional Imp-12 logout |
| `AuthContext.tsx` | `refreshProfile` | Reload | `getSession` + profiles | Auth+Table | Imp-02/03/12 |
| `services/auth.ts` | AuthService | Alternate helpers | signIn/signOut/profiles | Auth+Table | same as above |
| `management.tsx` / `admin-users.tsx` | Edge callers | Bearer | `getSession` | Auth | Imp-02 access token |

---

## Edge fetch

| File | Purpose | Endpoint | Replacement |
|---|---|---|---|
| `management.tsx` | Create user | `/functions/v1/create-user` | Imp-12 Edge → Imp-03/11 |
| `management.tsx` | Delete user | `/functions/v1/delete-user` | Imp-12 → Imp-03 |
| `admin-users.tsx` | Create/Delete | same | Imp-12 |
| `scripts/create-test-users.ts` | Seed script | same | Imp-12 (script) |

---

## RPC

| File | RPC | Replacement |
|---|---|---|
| `management.tsx` | `delete_chantier_cascade` | Imp-12 RPC → Imp-04 |
| `admin-worksites.tsx` | same | Imp-12 → Imp-04 |
| `ouvrierDeclaration.ts` | `auto_approve_week…` **commented** | Dead — **OUT** |

---

## Realtime

| File | Tables | Replacement |
|---|---|---|
| `timesheet.tsx` | periodes + declarations `*` | Imp-09 `/events` (FE change) — **NO** postgres_changes bridge |
| `validation.tsx` | both | same |
| `chef-dashboard.tsx` | periodes | same |

---

## Tables (grouped by file)

| File | Tables touched | Verbs (summary) | Replacement owner |
|---|---|---|---|
| `AuthContext.tsx` | profiles, affectations_chantiers, zones_ouvriers | SELECT (+embeds) | Imp-03/05/12 — embeds **gap** |
| `services/periods.ts` | periodes_travail | SELECT/INSERT/UPDATE (+embeds) | Imp-06/12 |
| `services/worksites.ts` | affectations_chantiers | SELECT/INSERT/UPDATE (+embeds) | Imp-05/12 |
| `services/auth.ts` | profiles | SELECT/UPDATE | Imp-03/11/12 |
| `utils/team.ts` | affectations, chantiers, zones_equipe | SELECT (+embeds) | Imp-04/05/12 |
| `utils/worksiteCode.ts` | chantiers | SELECT code | Imp-04/12 |
| `utils/ouvrierDeclaration.ts` | periodes, declarations, chantiers | SELECT/INSERT | Imp-06/04/12 |
| `ChooseDayCalendar.tsx` | periodes, declarations | SELECT | Imp-06/12 |
| `declare-day*.tsx` | chantiers, periodes, declarations | SELECT/INSERT | Imp-04/06/12 |
| `timesheet.tsx` | periodes, declarations, chantiers | CRUD + RT | Imp-06/04/12 + Imp-09 |
| `ouvrier-dashboard.tsx` | periodes, declarations | SELECT embeds | Imp-06/12 |
| `chef-dashboard.tsx` | zones*, affectations, periodes | SELECT/UPDATE + RT | Imp-05/06/12 + Imp-09 |
| `validation.tsx` | declarations, periodes | SELECT/UPDATE/DELETE + RT | Imp-06/07 — UPDATE decl **Blocked B-003=C** |
| `export.tsx` | periodes | SELECT embeds | Imp-06/12 or Imp-08 **unused by FE** |
| `user-payroll.tsx` | declarations | SELECT | Imp-06/12 |
| `management.tsx` | profiles, affectations, zones*, chantiers | full + upsert + Edge + RPC | Imp-03/04/05/11/12 — many gaps |
| `admin-users.tsx` | profiles + Edge | SELECT/UPDATE | Imp-11/12 |
| `admin-worksites.tsx` | chantiers, affectations, profiles + RPC | CRUD | Imp-04/05/12 |
| `worksite-detail.tsx` | chantiers, affectations, profiles | CRUD | Imp-04/05/12 |
| `team-management.tsx` | zones* + profiles | deep SELECT + writes | Imp-05/12 — deep SELECT **gap** |

---

## Storage

| File | Usage |
|---|---|
| — | **None** |

---

## Biometrics / language (not Supabase)

| File | Storage | Purpose |
|---|---|---|
| `biometricAuth.ts` | SecureStore email/password | Device PIN login |
| `i18n/index.ts` | localStorage language | i18n |
