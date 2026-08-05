# PHASE14_DATABASE_VALIDATION.md

**Date:** 2026-07-15  
**Tool:** `docker exec chantier-db psql -U chantier -d chantier`

## Tables (public)

```
affectations_chantiers
approval_audit_events
chantiers
declarations_heures
periodes_travail
profiles
refresh_tokens
schema_migrations
zones_chantiers
zones_equipe
zones_ouvriers
```

**11 tables — PASS**

## Migrations

`schema_migrations.id` applied (10):

- 001_platform_bootstrap.sql … 010_imp11_admin_profiles.sql  
- `/health` reports `pending: []`

**PASS**

## Live row counts (approx / pg_stat + exact COUNT)

Exact counts observed during validation:

| Table | COUNT(*) |
|---|---|
| profiles | 974 |
| chantiers | 354 |
| affectations_chantiers | 484 |
| zones_equipe | 72 |
| zones_chantiers | 44 |
| zones_ouvriers | 67 |
| periodes_travail | 646 |
| declarations_heures | 645 |

> These counts reflect **seed + Imp-*/Phase13 automated test residue** on the long-lived Docker volume — not a clean production import.

## Seed users present

| email | role | actif |
|---|---|---|
| admin@local.test | admin | t |
| chef@local.test | chef_equipe | t |
| ouvrier@local.test | ouvrier | t |
| administratif@local.test | administratif | t |

Plus leftover edge test user(s).

## Constraints (sample)

45 constraints including:

- PK / UNIQUE (email, chantier code, affectation user+chantier, declaration user+chantier+date, zone links)
- FK profiles → refresh_tokens, affectations, zones, periods, declarations, audit
- CHECK date ranges, period status, declaration hours/paniers/statut

**PASS** — constraint catalog intact.

## Indexes

35 indexes covering PKs, uniques, and query helpers (`periodes_user_date_idx`, `declarations_statut_idx`, `affectations_*`, etc.).

**PASS**

## Sample business rows

- Chantier seed `C0001` / `Chantier Local Demo` present.  
- Declaration created during validation → transitioned `soumise` → `validee`.

## Verdict (DB structure)

**PASS** for schema, migrations, FKs, indexes.  
**NOTE:** Data volume is test-polluted (see comparison doc).
