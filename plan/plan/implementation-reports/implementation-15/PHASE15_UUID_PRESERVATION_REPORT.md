# PHASE15 — UUID Preservation Report

**Rule:** Do not generate new UUIDs for migrated entities. Reuse dump IDs.

## Spot checks (psql)

| Entity | UUID | Present |
|---|---|---|
| joseph.ad profile | `1200f3b8-b1d0-44ea-a75d-60f10993477b` | YES |
| Chantier EHY_004 | `2797f122-d255-40a8-83e3-fe4d8c80a352` | YES |

## Set comparison (ETL)

For each business table: `matching == merged_count`, `only_in_merged == []`, `only_in_local` empty except system actor on `profiles`.

| Table | matching | only_in_merged | only_in_local (excl. system) |
|---|---:|---:|---:|
| profiles | 9 | 0 | 0 |
| chantiers | 6 | 0 | 0 |
| affectations_chantiers | 12 | 0 | 0 |
| zones_* | 0 | 0 | 0 |
| periodes_travail | 41 | 0 | 0 |
| declarations_heures | 41 | 0 | 0 |

## Collision remap (from dump audit — not regenerating)

Discarded UUID `00ff4c88-626c-44a3-93b2-e6964af2ad73` was never inserted; kept `1200f3b8-…`.

**Verdict:** UUID preservation PASS.
