# Production vs Repository Schema Diff

> **Technical Investigation Complete · Waiting External Confirmation (2026-07-14):**  
> Dump dưới đây là **Verified Dump** của project **`hzppsttpzzeuslnpcdkv`**.  
> **Không** đồng nghĩa Production / Runtime SoT.  
> Runtime committed = **`afgveikz…`**. Equality Runtime DB == Dump DB = **unproven**.  
> Xem `SOURCE_OF_TRUTH_DECISION.md` · `CONFIDENCE_MATRIX.md` · `plan/plan/NEXT_ACTION_MATRIX.md`.  
> Không dùng file này để đổi SoT production cho đến khi External Confirmation + Phase 2 Gate đóng.

**Date:** 2026-07-14  
**Phase:** 2 — Database Reverse Engineering Validation  
**Dump type:** Schema-only (no user/business row data)  
**Artifacts:** `migration-analysis/production-dump/`

---

## Snapshot identity

| Field | Value |
|---|---|
| **Verified Dump project** | PostgreSQL **17.6** · **`hzppsttpzzeuslnpcdkv`** (CLI name **CHANTIER**) · pooler `aws-1-ap-northeast-1` |
| **Recorded `schema_migrations` on that DB** | **5** versions only — out of sync with live objects on **that** DB |
| **Repository Schema Version** | **65** SQL files under `supabase/migrations/` |
| **Committed Runtime URL (Phase 1)** | `afgveikzneaablcuzwdb` — **not dumped** this session |
| **Authority / SoT promotion** | **Waiting External Confirmation** — dump ≠ proven Production SoT |

> Deploy VM uses CI secrets for Supabase URL — value **unknown** in repo. Do **not** treat hzppst as production.

---

## Drift Summary (executive)

| Area | Verdict |
|---|---|
| Tables (8 public) | **Match** names with SoT / late migrations |
| Sequences | None on prod / SoT (uuid PKs) — **Match** |
| Core triggers (3 app) | **Present** on prod |
| Auth hook `on_auth_user_created` | **Absent** on prod — **Match** SoT |
| `schema_migrations` tracking | **Severe drift** — live schema ≫ 5 recorded migrations |
| Functions | Prod missing 3 repo functions; has 2 extras not in migrations |
| View `synthese_heures_journalieres` | **Older formula** (fixed 7h) vs repo cadre-based |
| `sync_declarations_from_periods` | **Older body** (hard DELETE, no soft-cancel, no `nb_deplacements` write) |
| Realtime `supabase_realtime` | **Empty** on prod (0 tables) vs repo migration adding periods/declarations |
| FK `zones_equipe.chef_equipe_id` | Prod **CASCADE**; repo later sets **RESTRICT** |
| RLS policies | Broadly similar; at least one **buggy** policy on prod; names lean on newer helpers (`get_my_role`) |

---

## 1. Extensions

| Extension | Production | Repository (implied) |
|---|---|---|
| `plpgsql` | 1.0 | yes |
| `pgcrypto` | 1.3 | yes (seed) |
| `uuid-ossp` | 1.1 | typically available |
| `pg_stat_statements` | 1.11 | platform |
| `supabase_vault` | 0.3.1 | platform |

No app-critical extension gap for migrate design.

---

## 2. Tables

| Table | Prod | Repo SoT |
|---|---|---|
| `profiles` | yes (+ `phone`, nullable `matricule`) | yes |
| `chantiers` | yes | yes |
| `affectations_chantiers` | yes | yes |
| `periodes_travail` | yes | yes |
| `declarations_heures` | yes (+ `nb_deplacements`) | yes |
| `zones_equipe` | yes | yes |
| `zones_chantiers` | yes | yes |
| `zones_ouvriers` | yes | yes |

**Tables only on production:** none (among public app tables).  
**Tables only in repository intent:** none additional public app tables found in SoT.

---

## 3. Views

| View | Production | Repository (late migrations) |
|---|---|---|
| `synthese_heures_journalieres` | `sum(calculer_duree_periode)` · normales = `LEAST(total, 7)` · HS = `GREATEST(total-7,0)` · panier/deplacement = bool_or → 0/1 | Uses `calculer_heures_cadre_chantier` + chantier `heure_debut/fin` (`20260522120000` / `20260618071528`) |

**Drift:** Production view is **pre–cadre chantier**; repo SoT documents newer definition.

---

## 4. Sequences

| | Production | Repo |
|---|---|---|
| public sequences | **0** | **0** (uuid) |

---

## 5. Indexes

Production indexes (29 including PK/unique) align with SoT naming for core tables (`idx_profiles_*`, `idx_periodes_*`, `idx_declarations_*`, zones uniques, etc.).

No major extra/missing index flagged for app tables in this pass. Fine-grained column expression parity not byte-compared.

---

## 6. Constraints / FKs — notable diffs

| Object | Production | Repository (later migration) |
|---|---|---|
| `zones_equipe.chef_equipe_id` FK | **ON DELETE CASCADE** | Migration `20260520120000_restrict_zones_equipe_chef_profile_delete.sql` → **ON DELETE RESTRICT** |
| `periodes_travail.statut` CHECK | `en_cours, terminee, validee, rejetee` (no `annulee`) | Same in SoT |
| `declarations_heures.statut` CHECK | includes **`annulee`** | Same |

**Risk:** Edge `delete-user` / docs assume RESTRICT on zone chef — **production CASCADE can delete zones when profile deleted**.

---

## 7. Triggers

### App triggers (public) — Production

| Trigger | Table | Events | Function |
|---|---|---|---|
| `trigger_sync_declarations` | `periodes_travail` | INSERT/UPDATE/DELETE | `sync_declarations_from_periods` |
| `trigger_sync_periods_from_declaration` | `declarations_heures` | UPDATE (statut/validated_*) | `sync_periods_from_declaration` |
| `trigger_auto_approve_matching_latest_validated_shift` | `declarations_heures` | INSERT/UPDATE | `auto_approve_if_matches_latest_validated_shift` |

**Parity vs SoT inventory:** all **3 present**.

### Auth hooks

| Check | Result |
|---|---|
| Triggers on `auth.users` | **0 rows** |
| `on_auth_user_created` / profile auto-create | **Not present** — confirms SoT / Phase 2 P2-T05 |

Platform triggers on `realtime` / `storage` ignored for migrate domain.

---

## 8. Functions / RPC

### On production (`public`)

| Function | Notes |
|---|---|
| `sync_declarations_from_periods` | **Older body** (see §8.1) |
| `sync_periods_from_declaration` | Present |
| `auto_approve_if_matches_latest_validated_shift` | Present (SECURITY DEFINER) |
| `delete_chantier_cascade` | Present |
| `calculer_duree_periode` | Present |
| `is_admin` | Present |
| `is_zone_owner` | Present |
| `get_chef_chantier_ids` | Present |
| `get_my_role` | **Prod only** — **not** in repo migrations |
| `rls_auto_enable` | **Prod only** — event trigger helper; **not** in repo migrations |

### In repository migrations / SoT but **missing on production**

| Function | Repo evidence |
|---|---|
| `minutes_from_time` | `20260522120000` / `20260618071528` |
| `calculer_heures_cadre_chantier` | same |
| `auto_approve_week_suggestion_replication` | `20260604103000` / `20260618071612` (FE call commented) |

### 8.1 `sync_declarations_from_periods` body drift

| Behavior | Production dump | Repo SoT (soft-cancel era) |
|---|---|---|
| When no active periods | **DELETE** matching `declarations_heures` | Soft-update `soumise` → `annulee`; delete only non-protected |
| UPSERT columns | heures, nb_paniers, statut, from_suggestion — **no `nb_deplacements`** | Same gap on late soft-cancel body (SoT already warned) |
| Status skip rejected periods | yes (`!= rejetee`) | yes |

---

## 9. RLS / Policies

- RLS **enabled** on all 8 public tables.
- ~**61** policies on production.
- Profiles admin insert/update use **`get_my_role() = 'admin'`** (not only inline role subquery / `is_admin()` as some migrations).
- **Bug on production:** policy `"Admin can insert zone ouvriers"` is defined as **`FOR SELECT`** (should be INSERT) — see dump `01_public_schema.sql`.

Wave B policy duplication cannot be fully proven from names alone; production policy set looks like a **merged mid-era** state, not a clean replay of all 65 files.

---

## 10. Realtime publication

| Publication | Production | Repo migration `enable_validation_realtime` |
|---|---|---|
| `supabase_realtime` | **exists, 0 tables** | Adds `declarations_heures`, `periodes_travail` |
| `supabase_realtime_messages_publication` | platform message partitions | n/a |

**Drift:** FE screens subscribe to `postgres_changes` on periods/declarations — **not backed by publication tables on this DB**. Matches risk that realtime may be dead on hzppst (or different project used at runtime).

---

## 11. `schema_migrations` vs repo files

| Source | Count |
|---|---|
| Prod `supabase_migrations.schema_migrations` | **5** (`20260311051724` … `20260311211649`) |
| Repo `supabase/migrations/*.sql` | **65** |

Live objects (zones, phone, delete cascade RPC, sync from declaration, auto-approve, …) **exist beyond** those 5 recorded versions ⇒ migrations were applied **outside** tracking or history was wiped/reset. **Do not trust** `schema_migrations` as complete version vector for hzppst.

---

## 12. Recommendation

1. **Treat `hzppst` dump as live truth** for Backend design of objects that exist; annotate repo-only functions as **not deployed**.
2. **Confirm** whether `chantier.vm.dfm-europe.com` / EAS use `hzppst` or `afgveikz` (Phase 1 R-14). Re-dump afgveikz if that is true traffic.
3. Before migrate: decide whether target BE should implement **prod behavior** (old sync DELETE + 7h view) or **repo-intended** behavior (soft-cancel + cadre hours) — product decision.
4. Fix or document RLS bug `Admin can insert zone ouvriers` and CASCADE vs RESTRICT on zones.
5. Re-enable realtime publication if live FE still expects it on this project.
6. **Rotate** DB password shared in chat; do not store in repo.

---

## Evidence files

| File | Content |
|---|---|
| `production-dump/01_public_schema.sql` | pg_dump schema-only `public` |
| `production-dump/02_auth_schema.sql` | pg_dump schema-only `auth` (structure; no auth.users data dump used for inventory beyond triggers) |
| `production-dump/03_inventory.txt` | Extensions, tables, indexes, constraints, triggers, functions, policies |
| `production-dump/04_function_bodies.sql` | `pg_get_functiondef` for public functions |
| `production-dump/05_extra_inventory.txt` | Migration history, realtime pubs, view def, missing funcs |
