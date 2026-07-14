# Database Schema Analysis

> **Technical Investigation Complete · Waiting External Confirmation (2026-07-14):** Documentation SoT vẫn lấy **repository migrations (65)** làm nền Phase 0.  
> Dump `hzppst` = **Verified Dump only** — **không** được coi là Production SoT cho đến khi External Confirmation (Scenario A/B/C) đóng Gate.  
> Không đổi Master Plan Done / Migration Readiness theo dump-as-prod trong bước này. Xem `SOURCE_OF_TRUTH_DECISION.md`.

**Nguồn lịch sử (Documentation SoT):** `supabase/migrations/` (65 files).  
**Verified Dump (hzppst, không = Production SoT):** `production-dump/` · diff: `production-vs-repository-diff.md` · decision: `SOURCE_OF_TRUTH_DECISION.md`.

> `afgveikz…` = committed FE/EAS runtime URL; **chưa** có schema dump.  
> Production VM URL = CI secrets — **unknown**.

Migration landscape (repo): wave **A** (202603–20260604); wave **B** (`20260618*`).  
Trên DB hzppst: `schema_migrations` chỉ **5** rows — quan sát dump; không dùng để khoá Production version.

---

## 1. Extensions / types / sequences

| Object | Production (hzppst) | Repo notes |
|--------|---------------------|------------|
| `pgcrypto`, `uuid-ossp`, `plpgsql`, `pg_stat_statements`, `supabase_vault` | Có | — |
| Custom ENUM / TYPE | **Không** — role & statut = `text` + CHECK | Same |
| SEQUENCE public | **Không** — PK `uuid` | Same |
| MATERIALIZED VIEW | **Không** | Same |

---

## 2. Tables

### 2.1 `profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, FK → `auth.users` CASCADE |
| `email` | text | NOT NULL |
| `nom`, `prenom` | text | NOT NULL |
| `matricule` | text | UNIQUE, nullable (default `''`) — **verified prod** |
| `role` | text | CHECK ∈ ouvrier, chef_equipe, administratif, admin |
| `phone` | text | default `''` — **verified prod** |
| `created_at`, `updated_at` | timestamptz | default now() |

Indexes: `idx_profiles_matricule`, `idx_profiles_role`. RLS on.

### 2.2 `chantiers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default gen_random_uuid() |
| `nom`, `code`, `adresse` | text | `code` UNIQUE |
| `actif` | boolean | default true |
| `date_debut` / `date_fin` | date | |
| `heure_debut` / `heure_fin` | time | Có trên bảng; **view prod chưa dùng cadre** — xem §3 |
| `created_at` | timestamptz | |

Indexes: `idx_chantiers_code`, `idx_chantiers_actif`. Không có DELETE policy — dùng RPC.

### 2.3 `affectations_chantiers`

Verified on prod: UNIQUE `(user_id, chantier_id)`; chef SET NULL; date range check. Indexes user/chantier/chef/dates.

### 2.4 `periodes_travail`

CHECK statut ∈ en_cours, terminee, validee, rejetee (**không** `annulee`). GPS/heure consistency checks present.

### 2.5 `declarations_heures`

UNIQUE `(user_id, chantier_id, date)`. Statut gồm **`annulee`**. Cột `nb_deplacements` có trên prod; trigger sync **không ghi**.

### 2.6 `zones_*`

- **Production FK** `zones_equipe.chef_equipe_id` → profiles **ON DELETE CASCADE** (repo sau đó đặt RESTRICT — **chưa** trên hzppst).

---

## 3. Views

### `synthese_heures_journalieres` — Production (authoritative)

- `sum(calculer_duree_periode)` · normales `LEAST(total,7)` · HS `GREATEST(total-7,0)` · panier/déplacement bool_or.

### Repo-intended (NOT on hzppst)

`calculer_heures_cadre_chantier` — functions **không** có trên prod.

---

## 4–5. Indexes / FKs

Xem `production-dump/03_inventory.txt`. Summary:

```
auth.users ← profiles
profiles ← affectations, periods, declarations, zones_equipe (CASCADE), zones_ouvriers, validated_by
chantiers ← affectations, periods, declarations, zones_chantiers
zones_equipe ← zones_chantiers, zones_ouvriers
```

---

## 6. Functions / Triggers / RLS

| Name | On hzppst? | Notes |
|------|------------|-------|
| `is_admin` / `is_zone_owner` / `get_chef_chantier_ids` | Yes | |
| `get_my_role` | Yes | Prod-only vs migrations |
| `rls_auto_enable` | Yes | Event helper |
| `calculer_duree_periode` | Yes | |
| `minutes_from_time` / `calculer_heures_cadre_chantier` | **No** | Repo only |
| `sync_declarations_from_periods` | Yes | Body cũ: **DELETE**, không soft-cancel |
| `sync_periods_from_declaration` | Yes | |
| `auto_approve_if_matches_latest_validated_shift` | Yes | |
| `delete_chantier_cascade` | Yes | |
| `auto_approve_week_suggestion_replication` | **No** | Repo only |

Triggers app (3): tất cả **có** trên prod. Auth.users triggers: **0**.

---

## 7. Realtime

Prod: `supabase_realtime` **0 tables**. Repo migration adds periods + declarations — **not applied** on hzppst.

---

## 8. Phase 2 verification checklist

- [x] Policy live (~61); bug `"Admin can insert zone ouvriers"` = FOR SELECT
- [x] sync body / nb_deplacements
- [x] No auth.users profile hook
- [ ] Dump `afgveikz…` if that is real traffic (R-14)
