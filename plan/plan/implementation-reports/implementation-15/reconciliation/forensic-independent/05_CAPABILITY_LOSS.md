# 05_CAPABILITY_LOSS.md

**Compared at:** 2026-07-16T01:32:38.937Z

Schema inspected independently of whether current values are equal.

| table | column | classification | rows≈ | reason | severity | recovery |
|---|---|---|---:|---|---|---|
| chantiers | __hours_model__ | CAPABILITY_LOSS | 6 | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. | HIGH | Store original window columns OR document accepted semantic change |
| chantiers | hours model | CAPABILITY_LOSS | 1 | DDL cannot store original single continuous window natively | HIGH | Keep original columns or accept semantic change in writing |
| periodes_travail | latitude_fin | CAPABILITY_LOSS | 59 | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end | HIGH | Add latitude_fin if product requires start≠end |
| periodes_travail | longitude_fin | CAPABILITY_LOSS | 59 | longitude_fin discarded; value equals debut — CAPABILITY LOSS | HIGH | Add longitude_fin if product requires start≠end |
| periodes_travail | __gps_model__ | CAPABILITY_LOSS | 59 | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end | HIGH | Extend schema OR accept written capability loss |
| periodes_travail | commentaire | CAPABILITY_LOSS | 59 | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) | HIGH | ALTER ADD commentaire + re-import |
| periodes_travail | GPS model | CAPABILITY_LOSS | 1 | DDL cannot represent start and end GPS points | HIGH | Add fin columns |
| periodes_travail | commentaire | CAPABILITY_LOSS | 1 | DDL has no commentaire | HIGH | ALTER ADD commentaire |
| declarations_heures | commentaire | CAPABILITY_LOSS | 57 | commentaire column absent — CAPABILITY LOSS | HIGH | ALTER ADD commentaire + re-import |
| declarations_heures | commentaire | CAPABILITY_LOSS | 1 | DDL has no commentaire | HIGH | ALTER ADD commentaire |

## Rules applied

| Case | Classification |
|---|---|
| GPS fin == debut | CAPABILITY LOSS |
| GPS fin ≠ debut | LOST (see 04) |
| commentaire empty + no column | CAPABILITY LOSS |
| commentaire non-empty + no column | LOST |
| continuous hours → 2-slot null apres | CAPABILITY LOSS |
