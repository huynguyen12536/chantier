# PHASE13_FIELD_MAPPING_AUDIT.md

**Date:** 2026-07-15  
**Evidence:** FE `types/index.ts` + observed `.select`/`.insert`/`.update` payloads vs Unified services/migrations/DTOs  

---

## 1. `profiles`

| FE (`types/Profile`) | Unified Imp-02/03/11 public profile | Match? |
|---|---|---|
| `id, email, nom, prenom, matricule, phone, role` | same | **YES** |
| `created_at, updated_at` | Returned from users list/get | **YES** (Imp-11 PROFILE_COLS) |
| Auth Session `user` | Imp-02 `publicProfile` (no password_hash) | **Partial** — Session wrapper differs |

---

## 2. `chantiers` — **CONFIRMED MISMATCH**

| FE expectation | Evidence | Unified Imp-04 `mapRow` / DB `003_chantiers.sql` |
|---|---|---|
| `heure_debut: string \| null` | `types/Chantier`; selects in timesheet/declare/management updates | **Absent** — uses `heure_debut_matin`, `heure_fin_matin`, `heure_debut_apres_midi`, `heure_fin_apres_midi` |
| `heure_fin: string \| null` | same | **Absent** as single field |
| `created_at` | FE type & embeds | Imp-04 `mapRow` **omits** `created_at` |
| `code, nom, adresse, actif, date_debut, date_fin` | FE | Present | **YES** |

FE write examples (`management.tsx` / `admin-worksites.tsx`) PATCH/INSERT `heure_debut`, `heure_fin`. Unified create/update schemas accept matin/après-midi fields only.

---

## 3. `periodes_travail`

| FE (`PeriodeTravail` / selects) | Imp-06 `mapPeriod` | Match? |
|---|---|---|
| `panier_repas`, `latitude_debut`, `longitude_debut`, `latitude_fin`, `longitude_fin` | Mapped from storage `panier`/`latitude`/`longitude`; fin null | **YES** (DTO aliases) |
| `statut` en_cours/terminee/validee/rejetee | Same set (+ validation may see `annulee` skipped in FE) | **YES** core |
| Embeds `chantiers(...)`, `profiles(...)` | listPeriods returns **flat** `mapPeriod` rows — **no embeds** | **MISMATCH** (shape nesting) |
| Unified `/api/timesheet/periods` wrapper `{ period, declaration }` | Imp-12 periodes adapter returns `result.period` on write | Flat period OK; list is array of periods | **Partial** |

---

## 4. `declarations_heures`

| FE (`DeclarationHeures`) | Imp-06 `mapDeclaration` | Match? |
|---|---|---|
| `heures_normales`, `heures_supplementaires`, `nb_paniers`, `nb_deplacements`, `statut`, … | Mapped | **YES** for flat row |
| FE type statut union omits `annulee` | DB allows `annulee`; FE cancel sets `annulee` in validation | **Type under-declares**; runtime uses `annulee` |
| Embeds profiles/chantiers | listDeclarations flat | **MISMATCH** nesting |
| Validation UPDATE statut | Imp-07 decide APIs — **not** flat table PATCH in Imp-12 (B-003=C) | **Gap** |

---

## 5. `affectations_chantiers`

| FE | Imp-05 service return | Match? |
|---|---|---|
| Row snake_case + optional `chantiers` embed | Raw SQL `RETURNING *` row; no embed | **Nested embed MISMATCH** |
| upsert conflict keys | `assignUser` ON CONFLICT in SQL | Keys align; transport upsert differs |

---

## 6. Zones tables

| FE | Imp-05 | Match? |
|---|---|---|
| Deep nested zone → chantiers → ouvriers → profiles | `listZones` returns `zones_equipe` rows only | **MISMATCH** — FE team-management SELECT shape not provided by Imp-05 list |
| Link/ouvrier rows | link/add/softRemove return link/membership rows | Flat write responses **YES** |

---

## 7. Auth session tokens

| FE (supabase Session) | Imp-12 authMapper / Imp-02 | Match? |
|---|---|---|
| `access_token`, `refresh_token`, `user`, `expires_in`, … | Mapper emits `access_token`, `refresh_token`, `token_type`, `expires_in`, `user` | **Field names align** for token body |
| Full Session + auto-refresh + onAuthStateChange | Not a drop-in Session manager | **Lifecycle MISMATCH** |

---

## 8. Enum / status notes

| Entity | FE observes | Unified DB |
|---|---|---|
| Declaration | brouillon, soumise, validee, rejetee (+ annulee in cancel code) | CHECK includes annulee |
| Period | en_cours, terminee, validee, rejetee (+ annulee filtered in validation load) | period CHECK without annulee in 005; FE still filters `annulee` on periods |

---

## 9. Summary of mismatches (must not ignore at cutover)

1. **chantiers `heure_debut`/`heure_fin` vs matin/après-midi columns**  
2. **PostgREST embeds vs flat Unified/compat lists**  
3. **declarations UPDATE path vs Imp-07 / Imp-12 B-003=C**  
4. **Auth Session lifecycle vs token REST**  
5. **zones deep SELECT vs Imp-05 listZones**
