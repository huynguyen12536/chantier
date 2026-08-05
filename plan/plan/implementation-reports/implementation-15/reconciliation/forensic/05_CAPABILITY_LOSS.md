# 05_CAPABILITY_LOSS.md

**Compared at:** 2026-07-16T01:21:43.040Z

Rule: if destination cannot represent the source model, report CAPABILITY LOSS even when current values are equal/zero.

| table | field | status | evidence | severity |
|---|---|---|---|---|
| chantiers | __hours_model__ | CAPABILITY_LOSS | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. (rows≈6) | HIGH |
| periodes_travail | __gps_model__ | CAPABILITY_LOSS | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS (rows≈59) | HIGH |
| periodes_travail | commentaire | CAPABILITY_LOSS | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) (rows≈59) | HIGH |
| declarations_heures | commentaire | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS (empty/null in this row) (rows≈57) | HIGH |

## Distinction

| Case | Classification |
|---|---|
| GPS fin == debut (e.g. all zeros) | CAPABILITY LOSS |
| GPS fin ≠ debut | BUSINESS DATA LOSS (see 04) |
| commentaire null/empty + no column | CAPABILITY LOSS |
| commentaire non-empty + no column | BUSINESS DATA LOSS |
| hours 1-window → 2-slot null apres start | CAPABILITY LOSS (semantics) |
