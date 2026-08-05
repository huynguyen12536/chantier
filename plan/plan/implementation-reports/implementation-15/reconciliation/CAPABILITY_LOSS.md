# CAPABILITY_LOSS.md

**Compared at:** 2026-07-15T15:38:02.126Z

## Rule

If destination schema cannot represent the source business model, report CAPABILITY LOSS — **even if all current values are zero**.

| table | field | detail |
|---|---|---|
| chantiers | __hours_model__ | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| periodes_travail | latitude_fin | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | longitude_fin | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | __gps_model__ | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | commentaire | destination schema has no commentaire column |
| declarations_heures | commentaire | destination schema has no commentaire column |
