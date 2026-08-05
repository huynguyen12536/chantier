# 02_MERGED_TO_LOCAL_AUDIT.md

**Compared at:** 2026-07-16T01:21:43.040Z  
**Source of truth:** merged.json  
**Target:** local Postgres (tz=UTC)  
**DATE/TIME compare:** via `::text` (avoids node-pg TZ false −1 day)

## Status counts by table

| Table | Missing | Extra | MATCH | TRANSFORMED | DEFAULTED | GENERATED | MODIFIED | LOST | CAPABILITY_LOSS | LOST_AUTH | UNKNOWN |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| profiles | 0 | 1 | 71 | 1 | 9 | 0 | 9 | 0 | 0 | 9 | 0 |
| chantiers | 0 | 0 | 48 | 12 | 6 | 0 | 0 | 0 | 6 | 0 | 0 |
| affectations_chantiers | 0 | 0 | 84 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_equipe | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_chantiers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_ouvriers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| periodes_travail | 0 | 0 | 767 | 177 | 0 | 0 | 0 | 0 | 236 | 0 | 0 |
| declarations_heures | 0 | 0 | 798 | 0 | 0 | 0 | 0 | 0 | 57 | 0 | 0 |

## Transform proof rules applied

| Mapping | Valid TRANSFORMED only if | Else |
|---|---|---|
| heure_debut→heure_debut_matin | exact clock equality | MODIFIED |
| heure_fin→fin_matin+fin_apres_midi | exact clock in both | MODIFIED |
| hours model 1-window→2-slot | — | CAPABILITY_LOSS (semantics) |
| lat/lon_debut→lat/lon | exact numeric equality | MODIFIED |
| lat/lon_fin | equal to debut → CAPABILITY_LOSS; distinct → LOST | |
| panier_repas→panier | exact boolean | MODIFIED |
| commentaire | no dest column | CAPABILITY_LOSS or LOST if non-empty |
| password_hash | — | LOST_AUTHENTICATION (never MATCH) |

## Non-MATCH fields (evidence required)

### profiles

#### `05fae8ca-461d-480a-9ee0-8ee80cc0e85f`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-07-06T13:42:41.943Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `1200f3b8-b1d0-44ea-a75d-60f10993477b`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| matricule | TRANSFORMED | "" | null | ETL normalizes empty/whitespace matricule to NULL — both mean absent | LOW |
| updated_at | MODIFIED | "2026-06-18T08:38:27.151Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `1d5ac48f-9eae-452a-a998-1b480f87ce18`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-25T08:21:49.203Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `47c68c11-eff5-4ba3-9368-252c38d30825`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-19T02:54:59.773Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `5609a530-0e12-4e78-8104-d810cae90075`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-25T08:22:47.803Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `abcca969-52ff-40fc-902d-82de4743462f`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-22T02:17:30.934Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `aef70554-b535-4408-9407-946db41f772d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-24T09:31:38.495Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `eb5d70b5-0e89-49df-8254-01eaaf25ad3e`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-07-06T13:43:34.273Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

#### `f7c50816-459c-4a6d-a782-fe498d1988e4`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| password_hash | LOST_AUTHENTICATION | null | "$2b$10$…" | merged.json has no password_hash; auth.users not in dumps; local hash is synthetic/ops — original authentication cannot be reconstructed | CRITICAL |
| actif | DEFAULTED |  | true | merged has no actif; local COALESCE(..., TRUE) | LOW |
| updated_at | MODIFIED | "2026-06-25T04:40:12.601Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — likely GENERATED overwrite (ETL/ops) | MEDIUM |

### chantiers

#### `2797f122-d255-40a8-83e3-fe4d8c80a352`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-23T03:37:45.575Z" | updated_at absent in merged dump; filled at ETL | LOW |

#### `34592189-ae34-4063-9bae-8d08b83719ff`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-25T06:42:06.634Z" | updated_at absent in merged dump; filled at ETL | LOW |

#### `5294fce8-3d77-40c7-8d5d-ab341f0e926f`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-25T09:38:12.160Z" | updated_at absent in merged dump; filled at ETL | LOW |

#### `9b4e164b-ca34-4d39-93ce-9641a475a11a`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-22T02:26:50.096Z" | updated_at absent in merged dump; filled at ETL | LOW |

#### `bb17663c-2e02-4e79-8763-eecf3f3aeee4`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-22T02:24:03.507Z" | updated_at absent in merged dump; filled at ETL | LOW |

#### `f63c0560-07a8-4070-9711-0fbbd750404d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| heure_debut | TRANSFORMED | "07:30:00" | "07:30:00" | exact clock value of heure_debut found in heure_debut_matin | LOW |
| heure_fin | TRANSFORMED | "16:30:00" | {"heure_fin_matin":"16:30:00","heure_fin_apres_midi":"16:30:00"} | exact clock value of heure_fin copied to fin_matin and fin_apres_midi | LOW |
| __hours_model__ | CAPABILITY_LOSS | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | Source model is one continuous window. Destination forces 2-slot day with heure_debut_apres_midi=null and matin end=full-day end. Distinct morning/afternoon schedule cannot be represented. Clock values may be preserved; schedule semantics are not. | HIGH |
| updated_at | DEFAULTED |  | "2026-06-25T06:41:41.994Z" | updated_at absent in merged dump; filled at ETL | LOW |

### affectations_chantiers

_All comparable fields MATCH or table empty._

### zones_equipe

_All comparable fields MATCH or table empty._

### zones_chantiers

_All comparable fields MATCH or table empty._

### zones_ouvriers

_All comparable fields MATCH or table empty._

### periodes_travail

#### `05076fdb-6faf-4b8b-a91b-1219ae7c62c6`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `05a79907-1ef5-44df-88c3-5302d0c95782`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `05e3720a-9e64-4f34-b7cc-6ea1e64b78ae`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `0f256daa-126f-404c-b1d6-5160ccb21b1c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `126410ae-27ec-48f3-a291-15b0555c2b42`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `211565ff-d91d-4374-b375-ca0c75afe66e`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `24b78a5a-b456-406a-b41b-e2c0263f12ca`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `29d15a18-7822-4924-aab7-acdf26a3191b`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `2d876443-1fb0-4832-bb11-a077c9e86f93`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `310c12c1-145e-408b-8770-0335b4d9a2cf`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `38697e6f-f480-4223-84d2-94868cb280b0`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `3b55aa2d-564c-472b-a416-174e76c4dacc`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `3c5142a9-70bb-4100-8a3b-29405270d88c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `3dea0aed-3997-4ab0-ab52-2ad4de58a841`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `3e60c57b-d44c-4b4d-80f0-c42cbaba0723`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | false | false | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `3fbfae17-4d41-4b95-b51e-e9bc414f8db3`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `44503c24-7357-4b2d-9f63-ec4b11029006`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `4e8e1005-9813-4bc7-8081-4a090264f276`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `52ba9522-07a6-4caf-b75e-f9b09c4bb01b`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `58bc3424-cd58-4d36-8de8-e149d73705b8`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | false | false | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `5b61bda8-0405-42f7-b75a-f9993e8ac8ba`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `5ba5ae29-b9c4-4fc6-8f16-382572560b09`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `5cded969-5584-4767-986d-974dbcd3f51a`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `60130462-1584-4d3b-ac42-9674e31c621f`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `64367980-24c9-4944-8fb5-bc041fb19b6e`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `67b62aaf-e60f-4d35-8542-71a858778e9c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `6c335a82-1412-4053-9591-414a52d6f80d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `6f0fc149-91e1-485e-b5a5-d9f91cc53975`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `6fe8b225-e72a-464d-a51b-2529848a9ce5`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `7a9222d6-7143-4397-ab6c-622b65cf890e`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `8700fef2-83ee-45ef-abb4-f2e71e50baeb`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `88395f8a-c70e-4589-b790-3196f1552997`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `8c18258c-d98b-4933-a5f9-854950469619`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `8f35dec8-8d0a-499d-9240-a95c276a6082`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `99a58fc7-f6b0-45cd-bb27-b0e347af0a74`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `9c173268-595a-4ce9-87a1-b831e4c18e47`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `9c88b198-eedf-4a02-b667-050f9868bff0`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `b00d8302-6b88-4923-9b13-297747ecf337`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `bafcdde6-8b6e-477e-b5f6-42c391387464`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `c891c531-c781-401a-a9c7-7b42ead5dd49`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `c93418e9-5d99-41ec-8db7-1e78dbe434ff`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `ca17c607-3754-4ea3-815f-4a166c4028bd`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `ceae7537-6751-4ea9-a358-b5aff800e440`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `cf38eead-1d53-4d09-b2f1-966e816a59dc`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `d9991393-fba3-4525-ab1a-cd4ccc7e24fa`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `dabe2b6b-cd6f-4215-ab26-befeeaba2599`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `db0a23a9-e474-4658-bcb1-3fd09dd814c1`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `e037deb7-20ae-46c5-8407-e1ec1199f7a3`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `e61d74d6-36b5-4134-acc3-064778ef09bb`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `e989d730-2ad1-4269-9aea-f86610784c37`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `ed1a4203-df7d-4092-adac-bf43dc2872bc`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `ed640355-0897-4728-9323-a1a191506d86`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `f40c6bc8-d5bf-44dd-b7b5-245c0108953e`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `f57acb88-faa6-4c92-a73e-9daade3598aa`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `fcf5e723-8930-43c4-83f7-d0f094412a78`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

#### `fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| latitude_debut | TRANSFORMED | 0 | 0 | latitude_debut value equals local latitude | LOW |
| longitude_debut | TRANSFORMED | 0 | 0 | longitude_debut value equals local longitude | LOW |
| latitude_fin | CAPABILITY_LOSS | 0 | null | latitude_fin discarded; current value equals debut (or both zero). No unique coordinate value lost in this row, but schema cannot store a distinct end point — CAPABILITY LOSS | HIGH |
| longitude_fin | CAPABILITY_LOSS | 0 | null | longitude_fin discarded; current value equals debut (or both zero). CAPABILITY LOSS | HIGH |
| __gps_model__ | CAPABILITY_LOSS | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | 4 GPS columns → 2. Values equal in this dump; schema still cannot represent start≠end = CAPABILITY LOSS | HIGH |
| panier_repas | TRANSFORMED | true | true | panier_repas→panier boolean meaning preserved (exact) | LOW |
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent in destination DDL — CAPABILITY LOSS (value null/empty in this row) | HIGH |

### declarations_heures

#### `001509ff-9611-4c3a-bbc1-1e1a202479ea`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `009da677-8783-40c6-a1c9-ba49e3417c65`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `045f4fdf-8b36-4886-8ca2-2301abad12f2`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `0b6b955a-4206-4fda-9aa3-ffe4aff68cd2`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `1164884f-0f22-4a3e-86bb-0637f668e012`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `13e66a2c-262e-4fb3-a8b2-944be7d502df`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `15443add-c9da-49a4-90c1-e22edbb31d6a`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `1a71d186-1a8f-434e-98f3-77deca392d4a`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `1d323412-8d11-496c-9a38-10909b4efa1c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `1d60d5ac-68f0-4a95-8ad9-be615db0d380`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `2403747a-5a67-45c5-b8fd-209701555fbc`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `2a740baf-c2c2-4697-920e-0b5bc64bacf4`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `2d3b9658-7d93-4ce0-b6cf-a4bb5752b284`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `2de58ee0-8142-423d-ae0d-f4bc3e2ecb04`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `32c20159-03c4-4e81-8139-1c918397dc25`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `3d2cfaa2-f23d-424a-be7f-12e24eee0165`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `4de0691f-28e2-413e-a56d-b9712e2f88a4`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `58eb7217-d4ba-4102-a9b6-f407f09a5dff`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `6087837c-a0f1-41fc-823f-aaaedf0b7e03`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `61984bb7-d384-4662-a47d-5676e4175c76`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `657c3ee4-ddac-488b-9e48-bf9e69ecb508`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `68cdcb17-7ce6-4c74-8bf9-37d30651c1c0`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `717c73d2-b0f3-433f-a5b1-ab08a1368513`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `73c6632b-550d-457e-bcee-736ae85266d6`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `7a1aef37-3453-4e8c-a2f7-ab5a917b92a5`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `7c60847a-540c-47bb-9ce2-29dc4be7592c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `83ace382-75a7-4390-8511-f287928461b0`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `89b41680-b133-47eb-9510-eb79062c61d8`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `9698eb31-76c1-4a43-9cc9-ca6a86402f57`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `983d22b0-efb1-4f6e-949a-00098b1be06d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `9eff5ae0-eab2-42ef-b030-27e3bac88f9c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a15d0a33-7a8e-43b6-a7d6-9c49185046f4`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a4b3919d-9232-4351-803a-66c7f7544d08`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a51ef76e-8e40-4288-9a0b-30dda9eeb795`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a5891093-71da-4c42-8a66-66d1c578f5bd`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a6b3eea9-8702-4faa-9cfa-ccda4885279d`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `a827696c-9b85-4c2a-9ac3-d984144e7216`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `aaba3ff2-e0c0-4c3a-9f11-267ab851da5c`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `b26f0fd2-05af-48b5-9f38-ad7805af4554`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `bcae952b-e4c2-4800-ab8c-044b6eafe0cc`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `bd04608e-5d96-4516-9311-03c36e3efb35`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `c1c7d171-9542-4c02-bb24-b372883ed8e5`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `ce5aa37f-2f66-4471-a51f-54186e005fe9`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `d0602828-2132-43f7-a53b-81af0d92dacb`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `d36aa7da-dd1b-41de-a65b-87b13272bda2`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `dbbc5b9c-2b65-4786-b0c4-18263a90cea3`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `dead0b27-d750-4577-92c6-dbf2593edb50`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `ea3d961e-def8-4f32-83b5-3e66f2e8540a`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `eb2b0e15-4200-4151-972a-1082f0f5fc04`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `ec563437-2c2c-4f29-8859-0d4e37cfd156`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `eea3035d-3c9a-4f2c-b94e-e67164ec2931`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `f261562f-160b-42d4-9bcc-0cba0196e345`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `f2d6b605-1f82-4a7f-bc2d-3d4b98d8ebc3`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `f3dbb9d2-ee49-4d67-986f-10054da1c666`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `fa9c3bac-2c1e-4bfd-bca2-c254556074c5`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `fc3a88cc-18de-4f8b-84df-a3982f32e7a0`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

#### `fd7a3de3-cdcd-4ca6-97d8-b2479026ddf6`

| field | status | source | dest | evidence | severity |
|---|---|---|---|---|---|
| commentaire | CAPABILITY_LOSS | null | null | commentaire column absent — CAPABILITY LOSS (empty/null in this row) | HIGH |

