# IMP11_FE_CONTRACT_REPORT — Administration FE reverse

**Date:** 2026-07-15  
**FE root:** `chantier1/Chantier-web-app-main/Chantier-web-app-main/`  
**Type:** Evidence-only. FE remains FROZEN.

---

## 1. Screens inventory

| Screen | File | Tab visibility | Role gate |
|---|---|---|---|
| Management hub (primary) | `app/(tabs)/management.tsx` | Shown if `canAccessManagement` | admin \| chef_equipe |
| Admin users (secondary) | `app/(tabs)/admin-users.tsx` | `href: null` | admin only; orphan |
| Admin worksites | `app/(tabs)/admin-worksites.tsx` | `href: null` | admin only; orphan |
| Worksite detail | `app/(tabs)/worksite-detail.tsx` | `href: null` | admin only; orphan |
| Team / zones | `app/(tabs)/team-management.tsx` | `href: null` | **no role check**; orphan |
| Profile labels | `app/(tabs)/profile.tsx` | always | text only for admin |

**Contract priority for Imp-11 parity:** hub `management.tsx` (live UX). Orphans are duplicate surfaces; Imp-12 may not need separate adapters if hub covered.

---

## 2. Role helpers (`utils/role.ts`)

| Helper | Meaning |
|---|---|
| `canAccessManagement` | admin \| chef_equipe |
| `canManageUsers` / `canDeleteInManagement` | admin only |
| `isAdminUserRoleLocked` | cannot change role of target `admin` (or self role lock pattern) |
| `canManageTeam` | chef (not used by orphan team screen) |

**Note:** `administratif` is **not** given management tab access in FE, even though Edge `create-user` allows administratif callers.

---

## 3. API calls (frozen contract)

### 3.1 Edge

| Call | Body | AuthZ (server) |
|---|---|---|
| `POST ${supabaseUrl}/functions/v1/create-user` | `{ email, password, nom, prenom, phone, role }` (+ optional matricule) | caller role ∈ admin, administratif; password ≥ 6; rollback auth user if profile insert fails |
| `POST …/functions/v1/delete-user` | `{ user_id }` | caller admin; not self; block if zones_equipe chef |

### 3.2 PostgREST / RPC (admin-relevant)

| Op | Target | Screen use |
|---|---|---|
| SELECT/UPDATE | `profiles` | list/edit users |
| SELECT/INSERT/UPDATE | `chantiers` | site CRUD |
| UPSERT / UPDATE `date_fin` | `affectations_chantiers` | assign / soft-remove; `chef_equipe_id` sync |
| SELECT | `zones_chantiers` | badge on site cards |
| RPC | `delete_chantier_cascade` | delete site |
| Zones tables | `zones_equipe`, `zones_chantiers`, `zones_ouvriers` | team-management orphan |

### 3.3 Not used on admin screens

- Realtime `postgres_changes` (confirmed in Imp-09 FE contract)  
- React Query invalidate  
- Storage

---

## 4. Client validations & lifecycle

| Rule | Evidence |
|---|---|
| Create: prenom, nom, email, password required | management create modal |
| Phone required + normalize | `utils/phone.ts` |
| Email format | `utils/email.ts` |
| Password length | Edge only (≥ 6) |
| Form roles offered | ouvrier \| chef_equipe \| admin — **not administratif** |
| Assignable to chantier | ouvrier \| chef_equipe only (`CHANTIER_ASSIGNABLE_ROLES`) |
| Demote chef blocked | active chef_equipe_id on affectations OR owns zone |
| Matricule immutable in edit UI | forced existing value |
| Soft-remove assignment | `date_fin = today` |
| Chef cannot create/delete worksite | FAB / canDelete admin-only |
| Chef can manage team on worksite | hideChantierDetails pattern |

---

## 5. Business flows touched (Administration)

| Flow | FE entry |
|---|---|
| A — provision / delete user | management Users tab; Edge |
| B — site + assign | management Worksites tab; RPC cascade |
| C — promote/demote + zones | role edit + demotion guards; team-management (zones) |

Flow D/E/F/G/H: out of this FE report’s Administration CRUD surface (H deferred entirely).

---

## 6. Unified mapping implication (no invent)

| FE call | Near-term Unified | Adapter (Imp-12) |
|---|---|---|
| Edge create-user | `POST /api/users` (+ phone if added) | `/functions/create-user` |
| Edge delete-user | `DELETE /api/users/:id` | `/functions/delete-user` |
| profiles UPDATE | **needs** `PATCH /api/users/:id` | `/tables/profiles` or keep REST |
| chantiers / affectations / zones / RPC | Imp-04/05 REST | table + RPC adapters |

---

## 7. Edge cases inventory

1. Dual UI: hub vs orphan admin-* routes.  
2. Edge allows creating `administratif` role; hub form does not offer it.  
3. `promoteChefsToChefEquipe` mostly no-op with current assignable roles.  
4. FR i18n key drift on secondary screens (`emailInvalid`).  
5. team-management reachable without FE role guard.  
6. Delete-user French error when zone chef remains.

**End of FE contract report. No FE changes.**
