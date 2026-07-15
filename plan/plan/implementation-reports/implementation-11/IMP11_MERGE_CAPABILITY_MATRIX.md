# IMP11_MERGE_CAPABILITY_MATRIX — UNION Capability Matrix

**Date:** 2026-07-15  
**Also known as:** UNION Capability Matrix (Imp-11 Administration)  
**Method:** Merge both first-class sources (CVL + Unified). Neither overwrites the other.  
**Type:** Investigation only — no production code.  
**Authoritative index:** `IMP11_INVESTIGATION_INDEX.md`  
**Objective:** Prove Unified Administration = **UNION** of Legacy CVL capabilities and current Unified backend (Imp-01→Imp-09), not a CVL clone and not a Unified-only replacement.

### Merge categories (mandatory)

1. Already merged  
2. Reuse existing implementation  
3. Needs REST endpoint only  
4. Needs additive SQL migration only  
5. Needs Administration business implementation  
6. Deferred to another phase (with evidence)

> Vocabulary rule: do **not** label “Missing” when the business exists in either source. Prefer “Needs REST / additive SQL / Admin business / Deferred”.

---

## Matrix legend

| Column | Meaning |
|---|---|
| Cap ID | Stable capability id |
| Legacy CVL | Evidence in migration-analysis / FE / Edge / RLS / dump |
| Unified | Evidence in api-chantier schema / APIs / Imp reports |
| Impl owner | Imp that delivered today’s Unified surface |
| Business owner | Flow A/B/C/… |
| DB / API owner | Who should own persistence / HTTP surface next |
| Merge decision | Category 1–6 |
| Required action | Concrete next step |
| Phase owner | Who executes |
| DB / API / Biz impact | Scope of change |

---

## A. Identity & profiles (UNION)

| Cap ID | Capability | Legacy CVL evidence | Unified evidence | Impl owner | Business owner | DB owner | API owner | Merge decision | Required action | Phase owner | DB impact | API impact | Business impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID-01 | User/profile identity row | `profiles` PK = `auth.users.id`; schema dump | `profiles` PK uuid; local credentials | Imp-02 | Flow A / Auth | Imp-02 schema | Auth + Users | **Already merged** | Keep 1:1 profile model | — | none | none | preserve |
| ID-02 | Roles enum 4 values | CHECK role; SHARED #1 | `profile_role` ENUM | Imp-02 | Flow A | Imp-02 | Users | **Already merged** | Preserve enum | — | none | none | preserve |
| ID-03 | Email unique identity | `profiles.email` NOT NULL | `email` UNIQUE NOT NULL | Imp-02/03 | Flow A | Imp-02 | Users | **Already merged** | Keep | — | none | none | preserve |
| ID-04 | Matricule store | UNIQUE nullable (`database-schema`) | `matricule TEXT` (no UNIQUE yet) | Imp-02 | Flow A | Imp-11 additive if UNIQUE required | Users | **Needs additive SQL migration only** (UNIQUE semantics) | Additive UNIQUE on non-empty matricule if confirmed | Imp-11 | `CREATE UNIQUE INDEX … WHERE matricule IS NOT NULL AND matricule <> ''` | none | preserve CVL uniqueness |
| ID-05 | Matricule auto-generate | Edge create-user `USR…` | Imp-03 `M`+hex COALESCE | Imp-03 | Flow A | Imp-03 | Users | **Already merged** | Keep auto-gen semantics (format may differ) | — | none | none | preserve capability |
| ID-06 | Phone on profile | dump `phone text default ''`; Edge+FE | column **absent** | — | Flow A | Imp-11 | Users | **Needs additive SQL migration only** | `ADD COLUMN phone TEXT NOT NULL DEFAULT ''` + wire create/update | Imp-11 | additive column | create/PATCH accept phone | preserve FE/Edge field |
| ID-07 | Nom / prenom | CVL NOT NULL | nullable TEXT | Imp-02 | Flow A | Imp-02 | Users | **Needs Administration business implementation** | Enforce required on create/update (CVL Edge) without DROP NULL rewrite | Imp-11 | none (validation) | Zod required | preserve |
| ID-08 | Soft identity disable `actif` | Not on CVL profiles dump (chantiers have actif) | `profiles.actif` + login gate | Imp-02 | Auth / Admin ops | Imp-02 | Auth | **Already merged** (Unified-native UNION keep) | Do not remove; optional admin toggle later | — | keep | optional PATCH later | Unified capability preserved |
| ID-09 | Local password credential | Supabase `auth.users` | `password_hash` on profiles | Imp-02 | Auth | Imp-02 | Auth | **Already merged** (Transform Keep) | Keep Imp-02 model | — | none | none | preserve login |
| ID-10 | Refresh session store | Supabase session | `refresh_tokens` | Imp-02 | Auth | Imp-02 | Auth | **Already merged** | Keep | — | none | none | preserve |
| ID-11 | `updated_at` on profiles | CVL timestamptz | Unified timestamptz | Imp-02 | Flow A | Imp-02 | Users | **Already merged** | Touch on PATCH when added | Imp-11 | none | PATCH bumps timestamp | preserve |

---

## B. Workforce lifecycle — Flow A

| Cap ID | Capability | Legacy CVL evidence | Unified evidence | Impl owner | Business owner | DB owner | API owner | Merge decision | Required action | Phase owner | DB impact | API impact | Business impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A-01 | Create user | Edge create-user; SHARED #2 | `POST /api/users` | Imp-03 | Flow A | Imp-02/03 | Users | **Already merged** | Wire phone when ID-06 added | Imp-11 minor | phone col | extend body | preserve |
| A-02 | Create authorized roles | admin \| administratif | same role gate | Imp-03 | Flow A | — | Users | **Already merged** | Keep | — | none | none | preserve |
| A-03 | Password ≥ 6 | Edge | Zod min 6 | Imp-03 | Flow A | — | Users | **Already merged** | Keep | — | none | none | preserve |
| A-04 | Rollback/consistency on create fail | Edge deletes auth user if profile insert fails | single INSERT profiles TX | Imp-03 | Flow A | Imp-03 | Users | **Already merged** | Keep atomic insert | — | none | none | preserve |
| A-05 | List users (management) | FE SELECT profiles | `GET /api/users` | Imp-03 | Flow A | — | Users | **Already merged** | Include phone in DTO after ID-06 | Imp-11 | none | response shape | preserve |
| A-06 | Get user by id | RLS/read profiles | `GET /api/users/:id` | Imp-03 | Flow A | — | Users | **Already merged** | Keep | — | none | none | preserve |
| A-07 | Update profile fields | FE UPDATE profiles; RLS admin/self | No PATCH route | — | Flow A | Imp-02 | Users | **Needs REST endpoint only** (+ validation) | Add `PATCH /api/users/:id` | Imp-11 | none (unless phone) | new method | preserve edit UX |
| A-08 | Update role (promote/demote) | Flow C + management edit role | No role PATCH | — | Flow A/C | Imp-02 | Users | **Needs Administration business implementation** | PATCH role + server guards (B-side) | Imp-11 | none | PATCH role | preserve Flow C |
| A-09 | Admin role lock | FE `isAdminUserRoleLocked` | — | — | Flow A | — | Users | **Needs Administration business implementation** | Enforce on PATCH (cannot re-role another admin / self rules as FE) | Imp-11 | none | 403/400 | preserve |
| A-10 | Delete user admin-only | Edge delete-user; SHARED #2 | `DELETE /api/users/:id` | Imp-03 | Flow A | Imp-03 | Users | **Already merged** | Keep | — | none | none | preserve |
| A-11 | No self-delete | Edge + FE | `SELF_DELETE` | Imp-03 | Flow A | — | Users | **Already merged** | Keep | — | none | none | preserve |
| A-12 | Block delete if zone chef | Edge zones_equipe check; SHARED #3 | `ZONE_RESTRICT` | Imp-03 (+ Imp-05 table) | Flow A | Zones table Imp-05 | Users | **Already merged** | Keep | — | none | none | preserve |
| A-13 | Cascade user data on delete | auth.admin.deleteUser CASCADE | `DELETE profiles` CASCADE FKs | Imp-03/05/06 schema | Flow A | Imp-02–06 FKs | Users | **Already merged** | Keep FK cascade | — | none | none | preserve |
| A-14 | Edge path `POST /functions/create-user` | FE contract / adapters | REST create exists | Imp-03 | Flow A | — | Imp-12 adapters | **Deferred to another phase** | Alias gateway | Imp-12 | none | adapter routes | preserve FE freeze |
| A-15 | Edge path `POST /functions/delete-user` | FE contract | REST delete exists | Imp-03 | Flow A | — | Imp-12 | **Deferred to another phase** | Alias gateway | Imp-12 | none | adapter | preserve FE freeze |

---

## C. Role / chef / demotion — Flow C (Admin ownership of policy; data owned by Imp-05)

| Cap ID | Capability | Legacy CVL evidence | Unified evidence | Impl owner | Business owner | DB owner | API owner | Merge decision | Required action | Phase owner | DB impact | API impact | Business impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C-01 | Promote ouvrier → chef_equipe | Flow C; FE role update | role column exists; no PATCH | Imp-02 data | Flow C | Imp-02 | Users Imp-11 | **Needs Administration business implementation** | PATCH role with policy | Imp-11 | none | PATCH | preserve promote |
| C-02 | Demote chef → non-chef | FE demotion guards | — | — | Flow C | Imp-05 tables (read) | Users Imp-11 | **Needs Administration business implementation** | On demote: block if active `affectations.chef_equipe_id` OR owns zone | Imp-11 | none (READ Imp-05) | 409 codes | preserve FE guards server-side |
| C-03 | Affectation chef ownership field | `affectations.chef_equipe_id` | same column Imp-05 | Imp-05 | Flow B/C | Imp-05 | Affectations | **Reuse existing implementation** | Imp-11 only **reads** for demotion guard; writes stay Imp-05 | Imp-05 / Imp-11 read | none | none Imp-11 write | preserve |
| C-04 | Sync chef_equipe_id when assigning managers | FE sync helpers | POST affectation accepts `chef_equipe_id` | Imp-05 | Flow B/C | Imp-05 | Affectations | **Reuse existing implementation** | Keep FE/Imp-05 write path; Imp-11 must not rewrite affectations BC | Imp-05 | none | none | preserve |
| C-05 | Zone chef ownership | `zones_equipe.chef_equipe_id` RESTRICT/CASCADE drift documented | Imp-05 RESTRICT | Imp-05 | Flow C | Imp-05 | Zones | **Reuse existing implementation** | Imp-11 demotion/delete read ownership only | Imp-05 | none | none | preserve |
| C-06 | Zones CRUD admin/chef | RLS; team-management FE | `/api/zones/*` | Imp-05 | Flow C | Imp-05 | Zones | **Reuse existing implementation** | Forbidden Imp-11 rewrite | — | none | none | preserve |

---

## D. Worksite / assignment adjacency (Admin UI uses; Imp-04/05 owns)

| Cap ID | Capability | Legacy CVL | Unified | Impl owner | Business owner | DB/API owner | Merge decision | Required action | Phase owner | Impacts |
|---|---|---|---|---|---|---|---|---|---|---|
| D-01 | Chantier CRUD + cadre | Flow B | Imp-04 REST | Imp-04 | Flow B | Imp-04 | **Reuse existing implementation** | Do not reimplement in Imp-11 | Imp-04 | none / none / none |
| D-02 | Cascade delete site | RPC + SUMMARY #13 | DELETE cascade TX | Imp-04 | Flow B | Imp-04 | **Reuse existing implementation** | Keep | Imp-04 | none |
| D-03 | RPC name adapter | FE `delete_chantier_cascade` | REST exists | Imp-04 | Flow B | Imp-12 | **Deferred to another phase** | `/rpc/…` alias | Imp-12 | adapter only |
| D-04 | Assign / soft-remove | Flow B FE | Imp-05 affectations | Imp-05 | Flow B | Imp-05 | **Reuse existing implementation** | Imp-11 forbidden write rewrite | Imp-05 | none |
| D-05 | Chef management team tab | FE management | Imp-05 writers include chef | Imp-05 | Flow B | Imp-05 | **Already merged** | Keep role split | — | none |
| D-06 | Chantier ownership (site record) | chantiers table | Imp-04 | Imp-04 | Flow B | Imp-04 | **Already merged** | Keep | — | none |

---

## E. Permissions / RBAC Administration

| Cap ID | Capability | Legacy CVL | Unified | Impl owner | Merge decision | Required action | Phase owner |
|---|---|---|---|---|---|---|---|
| P-01 | Role-scoped create/delete | RLS + Edge | requireRoles middleware | Imp-02/03 | **Already merged** | Keep | — |
| P-02 | Admin update others profiles | RLS `get_my_role()='admin'` | needs PATCH + role check | Imp-11 | **Needs Administration business implementation** | PATCH authZ = admin for others | Imp-11 |
| P-03 | Administratif create but not delete | Edge | Imp-03 same | Imp-03 | **Already merged** | Keep | — |
| P-04 | Administratif not zone admin | RLS | Imp-05 writers exclude administratif | Imp-05 | **Already merged** | Keep | — |
| P-05 | JWT actor identity | Supabase JWT / Unified JWT | Imp-02 | Imp-02 | **Already merged** | Keep | — |

---

## F. Observability / audit

| Cap ID | Capability | Legacy CVL | Unified | Merge decision | Required action | Phase owner |
|---|---|---|---|---|---|---|
| O-01 | Approval decision audit | Imp-07 / Flow E | `approval_audit_events` | **Reuse existing implementation** (wrong BC for user admin) | Do not overload for Imp-11 | Imp-07 |
| O-02 | Admin lifecycle audit | No CVL admin audit table evidenced | WAVE2 wording “auditable” | **Deferred to another phase** OR **Admin business via logs** | See DR-IMP11-003 — prefer structured logs (no invent table) | Human + Imp-11 |

---

## G. Explicitly out of Administration UNION (do not absorb)

| Cap ID | Capability | Why excluded from Imp-11 merge coding |
|---|---|---|
| X-01 | Timesheet / periods / declarations | Imp-06 |
| X-02 | Review approve/reject | Imp-07 |
| X-03 | Export / payroll | Imp-08 |
| X-04 | SSE realtime | Imp-09 CLOSED |
| X-05 | Super Admin / Company / Flow H | Decision Log Deferred |
| X-06 | FE source edits | FE Frozen → Imp-12 adapters only |

---

## Coverage proof (UNION)

| Source claim | Preserved? | How |
|---|---|---|
| CVL create/delete user | Yes | Already merged Imp-03 |
| CVL edit profile / role | Yes (capability exists in CVL) | Needs REST + Admin business Imp-11 |
| CVL phone field | Yes (exists in CVL) | Needs additive SQL Imp-11 |
| CVL demotion guards | Yes (exists in FE) | Needs Admin business Imp-11 (server) |
| CVL Edge URL shapes | Yes | Deferred Imp-12 (REST capability already exists) |
| Unified `actif` / password_hash / refresh | Yes | Already merged Imp-02 — keep |
| Unified Imp-04/05 ownership surfaces | Yes | Reuse — Imp-11 must not rewrite |
| Neither source dropped | Yes | No DROP/rename planned; additive only |

**COMPLETE COVERAGE status:** Every Administration-related capability inventoried above is classified into categories 1–6. No silent drop of CVL or Unified-native capabilities.

**Implementation gate:** Finalize Imp-11 coding plan only after Human answers DRs in `IMP11_DECISION_LOG_UPDATE.md` (especially adapter ownership + phone additive confirmation + audit form).
