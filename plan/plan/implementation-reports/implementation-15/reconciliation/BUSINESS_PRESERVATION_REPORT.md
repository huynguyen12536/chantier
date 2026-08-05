# BUSINESS_PRESERVATION_REPORT.md

**FROM SCRATCH — does not trust prior reports**  
**Compared at:** 2026-07-15T15:38:02.126Z  
**Source of truth:** `merged.json`  
**Target:** local Postgres `chantier`  
**PG timezone:** UTC | Node offset min: -420

---

## 9. FINAL VERDICT

# BUSINESS DATA LOSS

Business information not fully preserved: LOST AUTHENTICATION (9 users); CAPABILITY LOSS (GPS fin, commentaire, single-window hours model); MERGED email-collision discarded differing profile fields (nom/matricule/phone/created_at). Row/UUID equality does not constitute parity.

**Business parity score:** 55.68 / 100  
**Mean table field-preservation % (MATCH+TRANSFORMED):** 85.68%

| Structural check | Result | Sufficient for success? |
|---|---|---|
| Row counts match | YES | **NO** |
| UUIDs match | YES | **NO** |
| FKs intact | checked separately | **NO** |
| Business information preserved | **NO** | — |

---

## 1. Table-by-table preservation percentage

| Table | Merged | Local | Missing | Extra | MATCH | TRANSFORMED | MODIFIED | DEFAULTED | LOST | MERGED | UNKNOWN | Preservation % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| profiles | 9 | 10 | 0 | 1 | 71 | 0 | 10 | 9 | 9 | 0 | 0 | 71.72% |
| chantiers | 6 | 6 | 0 | 0 | 48 | 12 | 0 | 6 | 6 | 0 | 0 | 83.33% |
| affectations_chantiers | 12 | 12 | 0 | 0 | 84 | 0 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| zones_equipe | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| zones_chantiers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| zones_ouvriers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| periodes_travail | 59 | 59 | 0 | 0 | 767 | 177 | 0 | 0 | 236 | 0 | 0 | 80.00% |
| declarations_heures | 57 | 57 | 0 | 0 | 798 | 0 | 0 | 0 | 57 | 0 | 0 | 93.33% |

Preservation % = (MATCH + TRANSFORMED) / all classified field comparisons × 100.  
TRANSFORMED requires **100% business meaning preserved**. GPS fin discard and hours-model reshape are **LOST**, not TRANSFORMED.

---

## 7. Authentication parity

| Metric | Value |
|---|---|
| Original login possible | **NO** |
| LOST AUTHENTICATION users | 9 |
| Status | Never MATCH |

| id | email | role | status |
|---|---|---|---|
| 00000000-0000-4000-8000-000000000001 | system.auto-approve@platform.local | admin | SYSTEM_ACTOR |
| 47c68c11-eff5-4ba3-9368-252c38d30825 | nguyenthikieunghi.ltp202@gmail.com | admin | LOST_AUTHENTICATION |
| 1200f3b8-b1d0-44ea-a75d-60f10993477b | joseph.ad@arson-concept.ch | admin | LOST_AUTHENTICATION |
| aef70554-b535-4408-9407-946db41f772d | jasmine.tl@gmail.com | chef_equipe | LOST_AUTHENTICATION |
| f7c50816-459c-4a6d-a782-fe498d1988e4 | jasmine.collab@gmail.com | ouvrier | LOST_AUTHENTICATION |
| abcca969-52ff-40fc-902d-82de4743462f | jasmine.n@gmail.com | admin | LOST_AUTHENTICATION |
| 5609a530-0e12-4e78-8104-d810cae90075 | joseph.collab@arson-concept.ch | ouvrier | LOST_AUTHENTICATION |
| 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | la@yahoo.fr | ouvrier | LOST_AUTHENTICATION |
| eb5d70b5-0e89-49df-8254-01eaaf25ad3e | ap@gmail.com | ouvrier | LOST_AUTHENTICATION |
| 1d5ac48f-9eae-452a-a998-1b480f87ce18 | joseph.tl@arson-concept.ch | chef_equipe | LOST_AUTHENTICATION |

---

## 5. Merged information (email collision — every discarded field)

| email | discarded_id | kept_id | field | discarded_value | kept_value | equal? | information_lost? |
|---|---|---|---|---|---|---|---|
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | created_at | "2026-06-25T06:25:50.653Z" | "2026-06-18T08:38:27.151Z" | false | true |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | email | "joseph.ad@arson-concept.ch" | "joseph.ad@arson-concept.ch" | true | false |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | id | "00ff4c88-626c-44a3-93b2-e6964af2ad73" | "1200f3b8-b1d0-44ea-a75d-60f10993477b" | false | true |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | matricule | "USR750160" | "" | false | true |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | nom | "Arson" | "Asron" | false | true |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | phone | "+33234234234" | "+33342342354" | false | true |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | prenom | "Joseph" | "Joseph" | true | false |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | role | "admin" | "admin" | true | false |
| joseph.ad@arson-concept.ch | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | updated_at | "2026-06-25T06:25:50.653Z" | "2026-06-18T08:38:27.151Z" | false | true |

---

## 6. Capability losses

Even if current values are zero/null/empty, schema that cannot represent the source model = CAPABILITY LOSS.

| table | field | detail |
|---|---|---|
| chantiers | __hours_model__ | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| periodes_travail | latitude_fin | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | longitude_fin | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | __gps_model__ | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | commentaire | destination schema has no commentaire column |
| declarations_heures | commentaire | destination schema has no commentaire column |

### Capability summary
- **GPS:** 4 coordinates → 2. Cannot store distinct end point. LOST (not TRANSFORMED).
- **commentaire:** column absent. LOST.
- **chantiers hours model:** single window → forced 2-slot with null apres-midi start. Semantic capability lost.
- **auth.users:** not in destination import path. LOST AUTHENTICATION.

---

## 4. Generated information

| table | id | field | dest | detail |
|---|---|---|---|---|
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | matricule | null | kind mismatch source=empty dest=null (null≠empty≠false≠0) |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | aef70554-b535-4408-9407-946db41f772d | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | aef70554-b535-4408-9407-946db41f772d | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | aef70554-b535-4408-9407-946db41f772d | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | password_hash | "$2b$10$…" | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | actif | true | actif not in merged; local COALESCE(..., TRUE) |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | updated_at | "2026-07-15T14:53:42.410Z" | timestamp differs |
| chantiers | 2797f122-d255-40a8-83e3-fe4d8c80a352 | updated_at | "2026-06-23T03:37:45.575Z" | updated_at not in merged dump; filled at ETL |
| chantiers | 34592189-ae34-4063-9bae-8d08b83719ff | updated_at | "2026-06-25T06:42:06.634Z" | updated_at not in merged dump; filled at ETL |
| chantiers | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | updated_at | "2026-06-25T09:38:12.160Z" | updated_at not in merged dump; filled at ETL |
| chantiers | 9b4e164b-ca34-4d39-93ce-9641a475a11a | updated_at | "2026-06-22T02:26:50.096Z" | updated_at not in merged dump; filled at ETL |
| chantiers | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | updated_at | "2026-06-22T02:24:03.507Z" | updated_at not in merged dump; filled at ETL |
| chantiers | f63c0560-07a8-4070-9711-0fbbd750404d | updated_at | "2026-06-25T06:41:41.994Z" | updated_at not in merged dump; filled at ETL |

---

## 3. Lost information

| table | id | field | source | detail |
|---|---|---|---|---|
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | created_at | "2026-06-25T06:25:50.653Z" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | id | "00ff4c88-626c-44a3-93b2-e6964af2ad73" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | matricule | "USR750160" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | nom | "Arson" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | phone | "+33234234234" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | updated_at | "2026-06-25T06:25:50.653Z" | email collision joseph.ad@arson-concept.ch: discarded profile field not kept |
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | aef70554-b535-4408-9407-946db41f772d | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | password_hash | null | auth.users never in merged dump — original authentication cannot be reproduced. Never MATCH. |
| chantiers | 2797f122-d255-40a8-83e3-fe4d8c80a352 | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| chantiers | 34592189-ae34-4063-9bae-8d08b83719ff | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| chantiers | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| chantiers | 9b4e164b-ca34-4d39-93ce-9641a475a11a | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| chantiers | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| chantiers | f63c0560-07a8-4070-9711-0fbbd750404d | __hours_model__ | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | Source single continuous window cannot be reconstructed as distinct morning/afternoon slots (apres_midi start forced null; matin end = full-day end). Business schedule SEMANTICS not 100% preserved. |
| periodes_travail | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 05a79907-1ef5-44df-88c3-5302d0c95782 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05a79907-1ef5-44df-88c3-5302d0c95782 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05a79907-1ef5-44df-88c3-5302d0c95782 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 05a79907-1ef5-44df-88c3-5302d0c95782 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 0f256daa-126f-404c-b1d6-5160ccb21b1c | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 0f256daa-126f-404c-b1d6-5160ccb21b1c | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 0f256daa-126f-404c-b1d6-5160ccb21b1c | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 0f256daa-126f-404c-b1d6-5160ccb21b1c | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 126410ae-27ec-48f3-a291-15b0555c2b42 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 126410ae-27ec-48f3-a291-15b0555c2b42 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 126410ae-27ec-48f3-a291-15b0555c2b42 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 126410ae-27ec-48f3-a291-15b0555c2b42 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 211565ff-d91d-4374-b375-ca0c75afe66e | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 211565ff-d91d-4374-b375-ca0c75afe66e | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 211565ff-d91d-4374-b375-ca0c75afe66e | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 211565ff-d91d-4374-b375-ca0c75afe66e | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 24b78a5a-b456-406a-b41b-e2c0263f12ca | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 24b78a5a-b456-406a-b41b-e2c0263f12ca | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 24b78a5a-b456-406a-b41b-e2c0263f12ca | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 24b78a5a-b456-406a-b41b-e2c0263f12ca | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 29d15a18-7822-4924-aab7-acdf26a3191b | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 29d15a18-7822-4924-aab7-acdf26a3191b | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 29d15a18-7822-4924-aab7-acdf26a3191b | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 29d15a18-7822-4924-aab7-acdf26a3191b | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 2d876443-1fb0-4832-bb11-a077c9e86f93 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 2d876443-1fb0-4832-bb11-a077c9e86f93 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 2d876443-1fb0-4832-bb11-a077c9e86f93 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 2d876443-1fb0-4832-bb11-a077c9e86f93 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 310c12c1-145e-408b-8770-0335b4d9a2cf | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 310c12c1-145e-408b-8770-0335b4d9a2cf | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 310c12c1-145e-408b-8770-0335b4d9a2cf | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 310c12c1-145e-408b-8770-0335b4d9a2cf | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 38697e6f-f480-4223-84d2-94868cb280b0 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 38697e6f-f480-4223-84d2-94868cb280b0 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 38697e6f-f480-4223-84d2-94868cb280b0 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 38697e6f-f480-4223-84d2-94868cb280b0 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 3b55aa2d-564c-472b-a416-174e76c4dacc | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3b55aa2d-564c-472b-a416-174e76c4dacc | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3b55aa2d-564c-472b-a416-174e76c4dacc | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 3b55aa2d-564c-472b-a416-174e76c4dacc | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 3c5142a9-70bb-4100-8a3b-29405270d88c | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3c5142a9-70bb-4100-8a3b-29405270d88c | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3c5142a9-70bb-4100-8a3b-29405270d88c | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 3c5142a9-70bb-4100-8a3b-29405270d88c | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 44503c24-7357-4b2d-9f63-ec4b11029006 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 44503c24-7357-4b2d-9f63-ec4b11029006 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 44503c24-7357-4b2d-9f63-ec4b11029006 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 44503c24-7357-4b2d-9f63-ec4b11029006 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 4e8e1005-9813-4bc7-8081-4a090264f276 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 4e8e1005-9813-4bc7-8081-4a090264f276 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 4e8e1005-9813-4bc7-8081-4a090264f276 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 4e8e1005-9813-4bc7-8081-4a090264f276 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 58bc3424-cd58-4d36-8de8-e149d73705b8 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 58bc3424-cd58-4d36-8de8-e149d73705b8 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 58bc3424-cd58-4d36-8de8-e149d73705b8 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 58bc3424-cd58-4d36-8de8-e149d73705b8 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 5cded969-5584-4767-986d-974dbcd3f51a | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5cded969-5584-4767-986d-974dbcd3f51a | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 5cded969-5584-4767-986d-974dbcd3f51a | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 5cded969-5584-4767-986d-974dbcd3f51a | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 60130462-1584-4d3b-ac42-9674e31c621f | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 60130462-1584-4d3b-ac42-9674e31c621f | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 60130462-1584-4d3b-ac42-9674e31c621f | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 60130462-1584-4d3b-ac42-9674e31c621f | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 64367980-24c9-4944-8fb5-bc041fb19b6e | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 64367980-24c9-4944-8fb5-bc041fb19b6e | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 64367980-24c9-4944-8fb5-bc041fb19b6e | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 64367980-24c9-4944-8fb5-bc041fb19b6e | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 67b62aaf-e60f-4d35-8542-71a858778e9c | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 67b62aaf-e60f-4d35-8542-71a858778e9c | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 67b62aaf-e60f-4d35-8542-71a858778e9c | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 67b62aaf-e60f-4d35-8542-71a858778e9c | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 6c335a82-1412-4053-9591-414a52d6f80d | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6c335a82-1412-4053-9591-414a52d6f80d | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6c335a82-1412-4053-9591-414a52d6f80d | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 6c335a82-1412-4053-9591-414a52d6f80d | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 7a9222d6-7143-4397-ab6c-622b65cf890e | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 7a9222d6-7143-4397-ab6c-622b65cf890e | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 7a9222d6-7143-4397-ab6c-622b65cf890e | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 7a9222d6-7143-4397-ab6c-622b65cf890e | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 88395f8a-c70e-4589-b790-3196f1552997 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 88395f8a-c70e-4589-b790-3196f1552997 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 88395f8a-c70e-4589-b790-3196f1552997 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 88395f8a-c70e-4589-b790-3196f1552997 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 8c18258c-d98b-4933-a5f9-854950469619 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8c18258c-d98b-4933-a5f9-854950469619 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8c18258c-d98b-4933-a5f9-854950469619 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 8c18258c-d98b-4933-a5f9-854950469619 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 8f35dec8-8d0a-499d-9240-a95c276a6082 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8f35dec8-8d0a-499d-9240-a95c276a6082 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 8f35dec8-8d0a-499d-9240-a95c276a6082 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 8f35dec8-8d0a-499d-9240-a95c276a6082 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 9c173268-595a-4ce9-87a1-b831e4c18e47 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 9c173268-595a-4ce9-87a1-b831e4c18e47 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 9c173268-595a-4ce9-87a1-b831e4c18e47 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 9c173268-595a-4ce9-87a1-b831e4c18e47 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | 9c88b198-eedf-4a02-b667-050f9868bff0 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 9c88b198-eedf-4a02-b667-050f9868bff0 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | 9c88b198-eedf-4a02-b667-050f9868bff0 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | 9c88b198-eedf-4a02-b667-050f9868bff0 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | b00d8302-6b88-4923-9b13-297747ecf337 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | b00d8302-6b88-4923-9b13-297747ecf337 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | b00d8302-6b88-4923-9b13-297747ecf337 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | b00d8302-6b88-4923-9b13-297747ecf337 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | bafcdde6-8b6e-477e-b5f6-42c391387464 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | bafcdde6-8b6e-477e-b5f6-42c391387464 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | bafcdde6-8b6e-477e-b5f6-42c391387464 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | bafcdde6-8b6e-477e-b5f6-42c391387464 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | c891c531-c781-401a-a9c7-7b42ead5dd49 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | c891c531-c781-401a-a9c7-7b42ead5dd49 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | c891c531-c781-401a-a9c7-7b42ead5dd49 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | c891c531-c781-401a-a9c7-7b42ead5dd49 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | c93418e9-5d99-41ec-8db7-1e78dbe434ff | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | c93418e9-5d99-41ec-8db7-1e78dbe434ff | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | c93418e9-5d99-41ec-8db7-1e78dbe434ff | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | c93418e9-5d99-41ec-8db7-1e78dbe434ff | commentaire | null | destination schema has no commentaire column |
| periodes_travail | ca17c607-3754-4ea3-815f-4a166c4028bd | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ca17c607-3754-4ea3-815f-4a166c4028bd | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ca17c607-3754-4ea3-815f-4a166c4028bd | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | ca17c607-3754-4ea3-815f-4a166c4028bd | commentaire | null | destination schema has no commentaire column |
| periodes_travail | ceae7537-6751-4ea9-a358-b5aff800e440 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ceae7537-6751-4ea9-a358-b5aff800e440 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ceae7537-6751-4ea9-a358-b5aff800e440 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | ceae7537-6751-4ea9-a358-b5aff800e440 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | cf38eead-1d53-4d09-b2f1-966e816a59dc | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | cf38eead-1d53-4d09-b2f1-966e816a59dc | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | cf38eead-1d53-4d09-b2f1-966e816a59dc | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | cf38eead-1d53-4d09-b2f1-966e816a59dc | commentaire | null | destination schema has no commentaire column |
| periodes_travail | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | commentaire | null | destination schema has no commentaire column |
| periodes_travail | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | commentaire | null | destination schema has no commentaire column |
| periodes_travail | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | e61d74d6-36b5-4134-acc3-064778ef09bb | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e61d74d6-36b5-4134-acc3-064778ef09bb | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e61d74d6-36b5-4134-acc3-064778ef09bb | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | e61d74d6-36b5-4134-acc3-064778ef09bb | commentaire | null | destination schema has no commentaire column |
| periodes_travail | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | e989d730-2ad1-4269-9aea-f86610784c37 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e989d730-2ad1-4269-9aea-f86610784c37 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | e989d730-2ad1-4269-9aea-f86610784c37 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | e989d730-2ad1-4269-9aea-f86610784c37 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | ed1a4203-df7d-4092-adac-bf43dc2872bc | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ed1a4203-df7d-4092-adac-bf43dc2872bc | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ed1a4203-df7d-4092-adac-bf43dc2872bc | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | ed1a4203-df7d-4092-adac-bf43dc2872bc | commentaire | null | destination schema has no commentaire column |
| periodes_travail | ed640355-0897-4728-9323-a1a191506d86 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ed640355-0897-4728-9323-a1a191506d86 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | ed640355-0897-4728-9323-a1a191506d86 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | ed640355-0897-4728-9323-a1a191506d86 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | commentaire | null | destination schema has no commentaire column |
| periodes_travail | f57acb88-faa6-4c92-a73e-9daade3598aa | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | f57acb88-faa6-4c92-a73e-9daade3598aa | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | f57acb88-faa6-4c92-a73e-9daade3598aa | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | f57acb88-faa6-4c92-a73e-9daade3598aa | commentaire | null | destination schema has no commentaire column |
| periodes_travail | fcf5e723-8930-43c4-83f7-d0f094412a78 | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | fcf5e723-8930-43c4-83f7-d0f094412a78 | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | fcf5e723-8930-43c4-83f7-d0f094412a78 | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | fcf5e723-8930-43c4-83f7-d0f094412a78 | commentaire | null | destination schema has no commentaire column |
| periodes_travail | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | latitude_fin | 0 | latitude_fin discarded — destination has no end coordinate column |
| periodes_travail | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | longitude_fin | 0 | longitude_fin discarded — destination has no end coordinate column |
| periodes_travail | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | __gps_model__ | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | 4 GPS columns → 2. Destination CANNOT store a different end location. Even if all values are currently 0, this is CAPABILITY LOSS + DATA LOSS of fin coordinates. |
| periodes_travail | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 001509ff-9611-4c3a-bbc1-1e1a202479ea | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 009da677-8783-40c6-a1c9-ba49e3417c65 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 045f4fdf-8b36-4886-8ca2-2301abad12f2 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 0b6b955a-4206-4fda-9aa3-ffe4aff68cd2 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 1164884f-0f22-4a3e-86bb-0637f668e012 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 13e66a2c-262e-4fb3-a8b2-944be7d502df | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 15443add-c9da-49a4-90c1-e22edbb31d6a | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 1a71d186-1a8f-434e-98f3-77deca392d4a | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 1d323412-8d11-496c-9a38-10909b4efa1c | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 1d60d5ac-68f0-4a95-8ad9-be615db0d380 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 2403747a-5a67-45c5-b8fd-209701555fbc | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 2a740baf-c2c2-4697-920e-0b5bc64bacf4 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 2d3b9658-7d93-4ce0-b6cf-a4bb5752b284 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 2de58ee0-8142-423d-ae0d-f4bc3e2ecb04 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 32c20159-03c4-4e81-8139-1c918397dc25 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 3d2cfaa2-f23d-424a-be7f-12e24eee0165 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 4de0691f-28e2-413e-a56d-b9712e2f88a4 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 58eb7217-d4ba-4102-a9b6-f407f09a5dff | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 6087837c-a0f1-41fc-823f-aaaedf0b7e03 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 61984bb7-d384-4662-a47d-5676e4175c76 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 657c3ee4-ddac-488b-9e48-bf9e69ecb508 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 68cdcb17-7ce6-4c74-8bf9-37d30651c1c0 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 717c73d2-b0f3-433f-a5b1-ab08a1368513 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 73c6632b-550d-457e-bcee-736ae85266d6 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 7a1aef37-3453-4e8c-a2f7-ab5a917b92a5 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 7c60847a-540c-47bb-9ce2-29dc4be7592c | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 83ace382-75a7-4390-8511-f287928461b0 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 89b41680-b133-47eb-9510-eb79062c61d8 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 9698eb31-76c1-4a43-9cc9-ca6a86402f57 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 983d22b0-efb1-4f6e-949a-00098b1be06d | commentaire | null | destination schema has no commentaire column |
| declarations_heures | 9eff5ae0-eab2-42ef-b030-27e3bac88f9c | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a15d0a33-7a8e-43b6-a7d6-9c49185046f4 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a4b3919d-9232-4351-803a-66c7f7544d08 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a51ef76e-8e40-4288-9a0b-30dda9eeb795 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a5891093-71da-4c42-8a66-66d1c578f5bd | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a6b3eea9-8702-4faa-9cfa-ccda4885279d | commentaire | null | destination schema has no commentaire column |
| declarations_heures | a827696c-9b85-4c2a-9ac3-d984144e7216 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | aaba3ff2-e0c0-4c3a-9f11-267ab851da5c | commentaire | null | destination schema has no commentaire column |
| declarations_heures | b26f0fd2-05af-48b5-9f38-ad7805af4554 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | bcae952b-e4c2-4800-ab8c-044b6eafe0cc | commentaire | null | destination schema has no commentaire column |
| declarations_heures | bd04608e-5d96-4516-9311-03c36e3efb35 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | c1c7d171-9542-4c02-bb24-b372883ed8e5 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | ce5aa37f-2f66-4471-a51f-54186e005fe9 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | d0602828-2132-43f7-a53b-81af0d92dacb | commentaire | null | destination schema has no commentaire column |
| declarations_heures | d36aa7da-dd1b-41de-a65b-87b13272bda2 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | dbbc5b9c-2b65-4786-b0c4-18263a90cea3 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | dead0b27-d750-4577-92c6-dbf2593edb50 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | ea3d961e-def8-4f32-83b5-3e66f2e8540a | commentaire | null | destination schema has no commentaire column |
| declarations_heures | eb2b0e15-4200-4151-972a-1082f0f5fc04 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | ec563437-2c2c-4f29-8859-0d4e37cfd156 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | eea3035d-3c9a-4f2c-b94e-e67164ec2931 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | f261562f-160b-42d4-9bcc-0cba0196e345 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | f2d6b605-1f82-4a7f-bc2d-3d4b98d8ebc3 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | f3dbb9d2-ee49-4d67-986f-10054da1c666 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | fa9c3bac-2c1e-4bfd-bca2-c254556074c5 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | fc3a88cc-18de-4f8b-84df-a3982f32e7a0 | commentaire | null | destination schema has no commentaire column |
| declarations_heures | fd7a3de3-cdcd-4ca6-97d8-b2479026ddf6 | commentaire | null | destination schema has no commentaire column |

---

## Semantic equivalence

| Business process | Answer | Justification |
|---|---|---|
| Can user log in with original Supabase credentials? | **NO** | auth.users never migrated. All business password hashes are generated. LOST AUTHENTICATION for 9/9 users. |
| Can work period be reconstructed? | **PARTIAL** | All period UUIDs present; times/statut/user/chantier/date MATCH. GPS fin LOST (capability). commentaire LOST (capability). |
| Can chantier schedule be reconstructed? | **PARTIAL** | Chantier rows + date windows MATCH. Single heure_debut/heure_fin window mapped into 2-slot model — clock values partially preserved, schedule semantics NOT 100% (apres-midi start null). CAPABILITY/semantic loss. |
| Can declaration be reconstructed? | **PARTIAL** | All declaration UUIDs present; numeric hours/statuts MATCH. commentaire column LOST. |
| Can GPS history be reconstructed? | **NO** | Only one point stored. End coordinates permanently discarded. Schema cannot represent start≠end. CAPABILITY LOSS even when values are 0. |
| Can comments be reconstructed? | **NO** | commentaire absent from destination DDL. Capability lost (current dump has 0 non-empty values, but model cannot store comments). |

---

## 8. Business parity score breakdown

| Component | Value |
|---|---:|
| Mean table preservation % | 85.68 |
| Penalty: LOST AUTHENTICATION | -15 |
| Penalty: capability loss | -10 |
| Penalty: merge field loss | -5 |
| Penalty: missing rows | 0 |
| **Final score** | **55.68** |

---

## Hidden corruption

Count: 1

| table | id | field | detail |
|---|---|---|---|
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | matricule | kind mismatch source=empty dest=null (null≠empty≠false≠0) |

---

See also: `FIELD_BY_FIELD_PRESERVATION.md`, `LOST_INFORMATION.md`, `CAPABILITY_LOSS.md`, `AUTHENTICATION_PARITY.md`, `MERGED_INFORMATION.md`.

**STOP — Await Human Review. No data modified.**
