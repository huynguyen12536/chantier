# PHASE15 — Row Count Comparison

**Method:** `psql COUNT(*)` vs `merged.tables.*.length`  
**Also:** ETL self-check in `PHASE15_ETL_ARTIFACT.json`

| Table | Merged | Local | Match |
|---|---:|---:|---|
| profiles (business) | 9 | 9 | PASS |
| profiles (incl. system actor) | — | 10 | expected |
| chantiers | 6 | 6 | PASS |
| affectations_chantiers | 12 | 12 | PASS |
| zones_equipe | 0 | 0 | PASS |
| zones_chantiers | 0 | 0 | PASS |
| zones_ouvriers | 0 | 0 | PASS |
| periodes_travail | 41 | 41 | PASS |
| declarations_heures | 41 | 41 | PASS |

### Declaration status mix (local)

| statut | count |
|---|---:|
| validee | 37 |
| soumise | 4 |

**Verdict:** Row counts PASS for all merged business tables.
