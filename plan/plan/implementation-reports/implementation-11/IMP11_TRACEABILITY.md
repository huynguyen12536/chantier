# IMP11_TRACEABILITY — Administration investigation

**Date:** 2026-07-15  
**Type:** Evidence-only (no code / no schema / no migrations)  
**Scope:** Imp-11 Administration vs CVL `migration-analysis/` + Unified `api-chantier/`  
**Imp-09:** CLOSED — not modified

---

## 1. Scope definition (from SoT)

| Source | Imp-11 meaning |
|---|---|
| `WAVE2_IMPLEMENTATION_ROADMAP.md` Imp-11 | CVL-evidenced ops admin: users, roles, supported configuration; no Super Admin / multi-company |
| Depends On | Imp-02, Imp-03 |
| Decision Log | Flow H / Super Admin / multi-company = **out of scope** |
| Flows | Primarily **A** (user lifecycle), **C** (promote/demote + zone adjacency), residual ops from **B** already largely Imp-04/05 |

**Out of Imp-11 implementation surface (owned elsewhere):** Timesheet (Imp-06), Review (Imp-07), Export (Imp-08), Realtime (Imp-09), FE Edge/table adapters (Imp-12), Super Admin (Deferred).

---

## 2. Master traceability matrix

| # | Capability (CVL) | migration-analysis / Decision | Unified backend today | Parity |
|---|---|---|---|---|
| A1 | Create user (admin/administratif) | SUMMARY §5 #2; Flow A; Edge create-user; SHARED #2 | `POST /api/users` (Imp-03) | **Already implemented** |
| A2 | Password ≥ 6; required nom/prenom/email/role | Edge create-user; Flow A | Zod create schema Imp-03 | **Already implemented** (FE also requires phone — see A8) |
| A3 | Matricule auto if empty | Edge `USR…` / Unified `M`+hex | createUser COALESCE | **Already implemented** (format differs; semantics OK) |
| A4 | Create role enum 4 roles | Edge accepts all 4 | `z.enum(ROLES)` | **Already implemented** |
| A5 | Delete user admin-only | SUMMARY #2; Edge delete-user | `DELETE /api/users/:id` admin only | **Already implemented** |
| A6 | No self-delete | SUMMARY #3; Edge | `SELF_DELETE` 400 | **Already implemented** |
| A7 | Block delete if owns `zones_equipe` | SUMMARY #3; Edge | `ZONE_RESTRICT` 409 when table exists | **Already implemented** |
| A8 | Profile `phone` on create/edit | schema dump `phone`; Edge insert phone; FE required | **No `phone` column** in Unified migrations | **Missing** (schema gap) |
| A9 | Update user profile fields | FE PostgREST UPDATE profiles; RLS admin/self | **No PATCH `/api/users/:id`** | **Missing** |
| A10 | Change role (promote/demote) | Flow C; management demotion guards | **No role update API** | **Missing** |
| A11 | Demotion blocked if still `affectations.chef_equipe_id` | FE management L520–541; Flow C | Not enforced server-side | **Missing** |
| A12 | Demotion blocked if still zone chef | FE + shared with delete guard | Zone check only on **delete**, not on demote | **Missing** |
| A13 | Admin role lock (cannot change role of admin / self-role lock) | FE `isAdminUserRoleLocked` | N/A without PATCH | **Missing** |
| A14 | Sync `affectations.chef_equipe_id` on promote/assign | FE `syncChantierAffectationManagers` | Affectations accept `chef_equipe_id` on POST but no promote hook | **Partially implemented** |
| A15 | List users for management | FE SELECT profiles | `GET /api/users` admin/administratif | **Already implemented** |
| A16 | Edge `POST /functions/create-user` path | fe_contract_matrix; FE_COMPATIBILITY_ADAPTERS | REST only today | **Deferred** → Imp-12 adapters (recommend DR confirm) |
| A17 | Edge `POST /functions/delete-user` path | same | REST only | **Deferred** → Imp-12 |
| B1 | Create/update chantier | Flow B | Imp-04 POST/PATCH | **Already implemented** (Imp-04) |
| B2 | Cascade delete site | SUMMARY #13; RPC | Imp-04 DELETE TX cascade | **Already implemented** (Imp-04) |
| B3 | Assign / soft-remove affectations | Flow B | Imp-05 | **Already implemented** (Imp-05) |
| B4 | Chef edit site team (no delete site) | FE management chef mode | Affectations writers include chef; chantier DELETE = admin/administratif | **Already implemented** (role split exists) |
| B5 | RPC name `delete_chantier_cascade` | FE contract | REST DELETE only | **Deferred** → Imp-12 |
| C1 | Zones CRUD + links + soft-remove ouvriers | Flow C | Imp-05 `/api/zones/*` | **Already implemented** (Imp-05) |
| C2 | Administratif cannot admin zones | RLS; permissions_mapping | Zones writers admin+chef only | **Already implemented** |
| C3 | FE `team-management` orphan route | FE inventory | Backend zones ready | **Already implemented** backend; FE nav orphan = FE freeze / Imp-12 UX only |
| H1 | Super Admin / Company portal | Flow H “CHƯA CÓ”; Decision Log OOS | Absent | **Deferred by Decision Log** |
| X1 | Audit log of admin actions | WAVE2 Imp-11 acceptance “auditable” | No admin audit table evidenced in CVL for management | **Ambiguous** — see Decision Requests |

---

## 3. FE screen → SoT → backend

| FE screen | Roles (FE) | Primary ops | Backend owner |
|---|---|---|---|
| `management.tsx` (hub) | admin + chef_equipe | users (admin) + worksites/assign | Imp-03 gap PATCH; Imp-04/05 done |
| `admin-users.tsx` | admin only; orphan route | duplicate users UX | same |
| `admin-worksites.tsx` / `worksite-detail.tsx` | admin; orphan | duplicate worksites | Imp-04/05 |
| `team-management.tsx` | no FE guard; orphan | zones | Imp-05 |

---

## 4. Permissions mapping (Administration slice)

| Role | Create user | Delete user | Update user/role | Sites CRUD | Zones CRUD | Evidence |
|---|---|---|---|---|---|---|
| ouvrier | no | no | self profile only (CVL RLS) | no | membership read | permissions_mapping |
| chef_equipe | no | no | no (other users) | team assign (FE) | own zones | Flow C; Imp-05 |
| administratif | create yes | no | **RLS: typically not other profiles** | yes | no | Edge create; RLS profiles |
| admin | yes | yes | yes (others) | yes | yes | SUMMARY #2–3 |

---

## 5. Startability statement

See `IMP11_GAP_ANALYSIS.md` §Verdict and `IMP11_DECISION_REQUESTS.md`.

**Investigation complete. No production code written.**
