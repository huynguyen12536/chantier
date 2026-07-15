# PHASE13_POSTGREST_AUDIT.md

**Date:** 2026-07-15  
**Evidence-only** — extracted from FE source `.from(...).verb(...)` chains  
**FE runtime `.from` sites:** **108** (app/services/utils/contexts/components)

---

## 1. PostgREST feature presence (search)

| Feature | Present in FE? | Notes |
|---|---|---|
| `select(` | **YES** | Ubiquitous |
| `insert(` | **YES** | periods, affectations, zones, chantiers |
| `update(` | **YES** | periods, declarations, profiles, affectations, zones_ouvriers, chantiers |
| `delete(` | **YES** | periods, zones_equipe, zones_chantiers |
| `upsert(` | **YES** | `management.tsx` affectations `{ onConflict: 'user_id,chantier_id' }` |
| `rpc(` | **YES** | See Edge/RPC audit |
| `eq(` | **YES** | Very common |
| `neq(` | **YES** | `validation.tsx` `.neq('statut', 'rejetee')` |
| `gt(` | **NO** matches | — |
| `gte(` | **YES** | date ranges |
| `lt(` | **NO** matches | — |
| `lte(` | **YES** | date ranges / date_debut |
| `in(` | **YES** | ids, roles, statuts |
| `contains(` | **NO** (PostgREST) | — |
| `or(` | **YES** | date_fin null OR gte; search `nom.ilike`/`prenom.ilike` |
| `ilike` via `.or(` string | **YES** | `team-management.tsx` worker search |
| `order(` | **YES** | Common |
| `range(` | **NO** | — |
| `limit(` | **YES** | demotion checks, habit templates, default chantier |
| `single(` | **YES** | insert returning id |
| `maybeSingle(` | **YES** | profile by id, worksite detail, validation checks |
| `returns(` | **NO** | — |
| `csv` Prefer | **NO** | Client builds CSV/Excel locally |
| `head` / count Prefer | **NO** as PostgREST count | — |
| Embedded / FK selects | **YES** — extensive | See §3 |
| `.not('heure_fin', 'is', null)` | **YES** | `export.tsx` stats |
| `.is('date_fin', null)` | **YES** | AuthContext zones_ouvriers; management demotion |

---

## 2. Operations by table (FE app only)

### `profiles`

| Verb | Evidence files (representative) | Filters / select |
|---|---|---|
| SELECT `*` | AuthContext, management, admin-users, admin-worksites, worksite-detail, team-management | `eq id`, `order nom`, `in role`, `eq role` + `or ilike` |
| UPDATE | management (role / fields), auth.ts updateProfile | `eq id`; demotion promote `eq role ouvrier` |

### `chantiers`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | many | `*`; columns list; `eq actif`; `in id`; `order nom`; `select code` (worksiteCode) |
| INSERT | management, admin-worksites | includes `heure_debut`/`heure_fin` in FE forms |
| UPDATE | management, admin-worksites | same hour field names |

### `affectations_chantiers`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | AuthContext, worksites, management, chef, team, admin | Often `*, chantiers(*)` or `profiles(*)` embeds; `or` date_fin; `lte date_debut` |
| INSERT | worksites, admin-worksites, worksite-detail, management | |
| UPDATE soft `date_fin` | worksites, admin, worksite-detail, management | |
| UPDATE `chef_equipe_id` | management `syncChantierAffectationManagers` | `.eq chantier_id`.`.eq user_id`.`.is date_fin null` |
| UPSERT | management ~724–725 | `onConflict: 'user_id,chantier_id'` |

### `periodes_travail`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | timesheet, dashboards, validation, export, declare-*, ouvrierDeclaration, periods.ts, ChooseDayCalendar | embeds `chantiers(...)`, `profiles!...`; date `gte`/`lte`; `neq statut`; `.not heure_fin` |
| INSERT | timesheet, declare-*, periods.ts, ouvrierDeclaration replicate | payloads use `panier_repas`, geo fields |
| UPDATE | timesheet, periods.ts, chef-dashboard validate/reject, validation sync | statut transitions |
| DELETE | timesheet; validation cancel cascade | `eq` user/chantier/date + `in statut` |

### `declarations_heures`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | timesheet, dashboards, validation, user-payroll, ChooseDayCalendar, declare-*, ouvrierDeclaration | embeds profiles+chantiers on validation |
| UPDATE | validation validate/reject/cancel | statut + validated_by/at |
| INSERT | **none in FE** | Trigger/sync owned server-side historically |

### `zones_equipe`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | team-management deep embeds; chef-dashboard embeds; management demotion `limit 1` | Nested `zones_chantiers` + `zones_ouvriers` + profiles |
| INSERT | team-management | `.select('id').single()` |
| DELETE | team-management | `eq id` |
| UPDATE | (description via flow if present) | inserts primary |

### `zones_chantiers`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | management loadZones embed from parent; team nested | `chantier_id, zone_id, zones_equipe(...)` |
| INSERT | team-management | row `{ zone_id, chantier_id }` |
| DELETE | team-management | by id or `eq zone_id` + `in chantier_id` |

### `zones_ouvriers`

| Verb | Evidence | Notes |
|---|---|---|
| SELECT | AuthContext nested embed from zone membership path | `zones_chantiers(chantiers(...))` |
| INSERT | team-management | |
| UPDATE `date_fin` | team-management soft-remove | |

---

## 3. Embedded selects (complete distinct patterns observed)

1. `affectations_chantiers` → `chantiers(*)`  
2. `affectations_chantiers` → `profiles(*)` / `profiles!affectations_chantiers_user_id_fkey(...)`  
3. `periodes_travail` → `chantiers(nom, code, heure_debut, heure_fin)` / `chantiers(nom)` / `chantiers (heure_debut, heure_fin)` / `chantiers (nom, adresse)`  
4. `periodes_travail` → `profiles!periodes_travail_user_id_fkey (nom, prenom)`  
5. `declarations_heures` → `profiles!declarations_heures_user_id_fkey (...)`, `chantiers (nom, code)`  
6. `zones_equipe` → `zones_chantiers(..., chantiers(...))`, `zones_ouvriers(..., profiles!...)`  
7. `zones_equipe` → `zones_chantiers(chantier_id, chantiers(...))` (chef-dashboard)  
8. `zones_ouvriers` → `zones_chantiers(chantier_id, chantiers(...))` (AuthContext)  
9. `zones_chantiers` → `zones_equipe(id, nom, profiles!zones_equipe_chef_equipe_id_fkey(...))` (management)

---

## 4. Imp-12 table adapter vs features (fact)

Imp-12 Wave B delivers allow-list HTTP verbs with **simple** query params (`id`, `user_id`, `chantier_id`, `date`) — **not** the PostgREST filter/embed grammar listed above. Classification of gap → `PHASE13_FE_TO_BACKEND_MATRIX.md`.
