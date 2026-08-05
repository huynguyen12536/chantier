# PHASE14_DATA_COMPARISON.md

**Date:** 2026-07-15  
**Old source:** `migration-analysis/data-dumps/merged.json` (merged from two Supabase projects)  
**New source:** local Docker Postgres `chantier`

## Old dump summary

| Table | Merged row count |
|---|---|
| profiles | 9 |
| chantiers | 6 |
| affectations_chantiers | 12 |
| zones_equipe / zones_chantiers / zones_ouvriers | 0 |
| periodes_travail | 41 |
| declarations_heures | 41 |

Sources: `afgveikzneaablcuzwdb` + `hzppsttpzzeuslnpcdkv` (1 email collision remapped in audit).

## Local Postgres counts

| Table | Local COUNT(*) |
|---|---|
| profiles | 974 |
| chantiers | 354 |
| affectations_chantiers | 484 |
| zones_equipe | 72 |
| zones_chantiers | 44 |
| zones_ouvriers | 67 |
| periodes_travail | 646 |
| declarations_heures | 645 |

## PK / identity overlap check

Sample old profile IDs from merged dump:

- `47c68c11-eff5-4ba3-9368-252c38d30825`
- `abcca969-52ff-40fc-902d-82de4743462f`
- `1200f3b8-b1d0-44ea-a75d-60f10993477b`

```sql
SELECT COUNT(*) FROM profiles
WHERE id IN (...those three...);
-- result: 0
```

Emails from cloud (e.g. `joseph.ad@arson-concept.ch`, production gmail accounts) are **not** the Phase 13 seed set.

## Classification of differences

| Finding | Class | Reason |
|---|---|---|
| Local ≫ merged row counts | **Expected** | Local volume filled by Imp-/Phase13 automated tests + `seed:local`; Phase 13 explicitly out-of-scoped ETL/import |
| Old cloud PKs missing locally | **Expected** | No dump load into local DB |
| Local has zones rows; dump zones=0 | **Expected / mix** | Dump had empty zones; local tests created zones |
| Local users are `@local.test` seed | **Expected** | DR-P13-006 seed |
| Business parity of **cloud production data** | **Not verified** | Cannot claim data continuity until an authorized load phase |

## Unexpected?

None proven for schema. The **data content mismatch** is expected for this stage but **blocks any “production data parity” claim**.

## Verdict

**PASS** as comparison exercise.  
**FAIL** if gate = “local DB contains old Supabase business data” (that gate was never implemented).
