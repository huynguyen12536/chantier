# PHASE15 — ETL Implementation Report

**Date:** 2026-07-15  
**Status:** IMPLEMENTATION COMPLETE — Awaiting Human Review  
**Scope:** Offline load of `migration-analysis/data-dumps/merged.json` → local PostgreSQL  
**Non-goals:** No live Supabase pull; no API/JWT/RBAC/FE rewrite

---

## Delivered

| Artifact | Path |
|---|---|
| ETL loader | `api-chantier/scripts/etl-production-import.js` |
| npm script | `npm run seed:production-import` |
| Demo seed | `seed:local` retained for **development only** (header warning) |
| Machine artifact | `PHASE15_ETL_ARTIFACT.json` |

## Load order

1. `TRUNCATE` business + auth refresh/audit tables (CASCADE)  
2. Re-insert system auto-approve profile (`00000000-0000-4000-8000-000000000001`)  
3. `profiles` (preserve UUIDs)  
4. `chantiers` (map `heure_debut`/`heure_fin` → matin/après-midi columns)  
5. `affectations_chantiers`  
6. `zones_equipe` / `zones_chantiers` / `zones_ouvriers`  
7. `periodes_travail` (`panier_repas`→`panier`, `latitude_debut`→`latitude`)  
8. `declarations_heures`

## Identity merge

Reused `merged.audit` as-is (no new UUIDs):

| Collision email | Kept UUID | Discarded UUID | Source discarded |
|---|---|---|---|
| joseph.ad@arson-concept.ch | `1200f3b8-…` | `00ff4c88-…` | hzppst |

Merged dump already remapped FK references — orphan scan = 0.

## Passwords

`auth.users` was **not** in the dump. All 9 business profiles received documented temporary password:

- Env: `MIGRATION_TEMP_PASSWORD` (default `Phase15-TempPass!`)  
- Full list: `PHASE15_ETL_ARTIFACT.json` → `password_report`  
- **Not silent** — report lists every account.

## Run command

```bash
cd api-chantier
npm run seed:production-import
```

Requires `DATABASE_URL` pointing at local Postgres (Docker `chantier-db` / `.env`).
