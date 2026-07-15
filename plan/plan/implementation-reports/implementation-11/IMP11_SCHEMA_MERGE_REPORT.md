# IMP11_SCHEMA_MERGE_REPORT — Profiles / identity UNION

**Date:** 2026-07-15  
**Policy:** UNION database — additive migrations only. No DROP / rename / recreate / rewrite of Imp-01→09 migrations.  
**Type:** Investigation only.

---

## 1. Purpose

Compare **Legacy CVL** profile/identity schema with **Unified** current schema and define the **merged** target as the **union** of both—preserving every field/capability that either system requires for Administration.

---

## 2. Sources

| Source | Evidence |
|---|---|
| A — CVL | `migration-analysis/database-schema.md` §profiles; Edge create-user insert; FE management phone; dump notes |
| B — Unified | `api-chantier/migrations/002_auth_profiles.sql` (+ consumers Imp-03) |

---

## 3. Column-level UNION — `profiles`

| Column / attribute | CVL (A) | Unified (B) | Merged target | Action |
|---|---|---|---|---|
| `id` uuid PK | Yes (FK auth.users) | Yes (standalone PK) | Keep Unified PK model | Already merged (Transform auth) |
| `email` | NOT NULL | NOT NULL UNIQUE | Keep UNIQUE | Already merged |
| `nom` | NOT NULL | nullable | Keep column; **business** require on admin create/update | Needs Admin validation (no NOT NULL rewrite required if app enforces) |
| `prenom` | NOT NULL | nullable | same | Needs Admin validation |
| `matricule` | UNIQUE, nullable/default `''` | TEXT nullable, **no UNIQUE** | Keep column + **additive UNIQUE** for non-empty | Needs additive SQL |
| `role` | text CHECK 4 roles | `profile_role` ENUM 4 roles | Keep ENUM | Already merged |
| `phone` | text default `''` | **absent** | **Add** `phone TEXT NOT NULL DEFAULT ''` | **Needs additive SQL only** |
| `password_hash` | n/a (auth.users) | NOT NULL | Keep Unified | Already merged (Unified-native) |
| `actif` | not on CVL profiles dump | NOT NULL DEFAULT TRUE | Keep Unified | Already merged (Unified-native UNION keep) |
| `created_at` / `updated_at` | yes | yes | Keep | Already merged |
| Index `profiles_role` | yes | yes | Keep | Already merged |
| Index `profiles_matricule` | yes | no dedicated | Optional additive index with UNIQUE | With matricule UNIQUE |
| Index `profiles_actif` | n/a | yes | Keep | Already merged |

---

## 4. Related Administration tables (ownership — not Imp-11 rewrite)

| Table | CVL | Unified | Merge for Admin | Imp-11 may… |
|---|---|---|---|---|
| `affectations_chantiers` | yes | Imp-05 | Already merged | **READ** for demotion guard only |
| `zones_equipe` (+ links) | yes | Imp-05 | Already merged | **READ** for demotion/delete guards |
| `chantiers` | yes | Imp-04 | Already merged | none (reuse APIs) |
| `refresh_tokens` | n/a (Supabase session) | Imp-02 | Already merged | none |
| `approval_audit_events` | Imp-07 review BC | Imp-07 | Out of Admin BC | none |
| `auth.users` | CVL only | replaced by profiles+hash | Transform done Imp-02 | none |

---

## 5. Merged schema delta (ONLY additive Imp-11 candidate)

Single **new** migration file (not yet written — investigation forbids coding):

```sql
-- ILLUSTRATIVE ONLY — do not apply until Imp-11 authorized + DR-IMP11-002 = Yes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Preserve CVL uniqueness semantics without dropping nulls/empty
CREATE UNIQUE INDEX IF NOT EXISTS profiles_matricule_nonempty_uidx
  ON profiles (matricule)
  WHERE matricule IS NOT NULL AND btrim(matricule) <> '';
```

**Forbidden:** changing ENUM, dropping `actif`, rewriting `002_auth_profiles.sql`, renaming columns, touching Imp-04/05 tables in this migration.

---

## 6. Diagram — CVL → Unified → Merged

```
CVL profiles
  id,email,nom,prenom,matricule,role,phone,created_at,updated_at
  (+ auth.users credentials)
        │
        │ Transform Imp-02/03
        ▼
Unified profiles (today)
  id,email,password_hash,role,nom,prenom,matricule,actif,created_at,updated_at
  (− phone)  (− matricule UNIQUE)
        │
        │ UNION additive (Imp-11 candidate)
        ▼
Merged profiles
  ALL Unified columns
  + phone (from CVL)
  + matricule nonempty UNIQUE (from CVL)
  + keep password_hash, actif (from Unified)
```

---

## 7. Completeness statement

| Capability field | Present CVL? | Present Unified? | Already merged? | Additive migration? |
|---|---|---|---|---|
| users/profiles | yes | yes | yes | — |
| roles | yes | yes | yes | — |
| matricule value | yes | yes | yes | UNIQUE additive recommended |
| phone | yes | no | no | **yes** |
| permissions (RBAC) | yes | yes (middleware) | yes | — |
| affectations ownership | yes | yes | yes (Imp-05) | no Imp-11 DDL |
| chef / zone / chantier ownership | yes | yes | yes (Imp-04/05) | no Imp-11 DDL |
| admin lifecycle rows | yes | create/delete yes; update pending API | partial API | phone + UNIQUE only |

**No business dropped** if Imp-11 applies the additive phone (+ optional matricule UNIQUE) and exposes PATCH for updates that already exist as CVL PostgREST business.
