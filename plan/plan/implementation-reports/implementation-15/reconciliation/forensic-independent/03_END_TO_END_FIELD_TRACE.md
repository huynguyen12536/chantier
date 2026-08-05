# 03_END_TO_END_FIELD_TRACE.md

**Compared at:** 2026-07-16T01:32:38.937Z

Non-MATCH traces (MATCH summarized below).

| table | field | id | source_project | source/merged | local | status | reason |
|---|---|---|---|---|---|---|---|
| profiles | password_hash | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | hzppst | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | hzppst |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | hzppst | "2026-07-06T13:42:41.943Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | 1200f3b8-b1d0-44ea-a75d-60f10993477b | afgveikz | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | 1200f3b8-b1d0-44ea-a75d-60f10993477b | afgveikz |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | matricule | 1200f3b8-b1d0-44ea-a75d-60f10993477b | afgveikz | "" | null | TRANSFORMED | empty matricule → NULL; both mean absent — reconstructible |
| profiles | updated_at | 1200f3b8-b1d0-44ea-a75d-60f10993477b | afgveikz | "2026-06-18T08:38:27.151Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | hzppst | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | hzppst |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | hzppst | "2026-06-25T08:21:49.203Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | 47c68c11-eff5-4ba3-9368-252c38d30825 | afgveikz | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | 47c68c11-eff5-4ba3-9368-252c38d30825 | afgveikz |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | 47c68c11-eff5-4ba3-9368-252c38d30825 | afgveikz | "2026-06-19T02:54:59.773Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | 5609a530-0e12-4e78-8104-d810cae90075 | hzppst | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | 5609a530-0e12-4e78-8104-d810cae90075 | hzppst |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | 5609a530-0e12-4e78-8104-d810cae90075 | hzppst | "2026-06-25T08:22:47.803Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | abcca969-52ff-40fc-902d-82de4743462f | afgveikz | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | abcca969-52ff-40fc-902d-82de4743462f | afgveikz |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | abcca969-52ff-40fc-902d-82de4743462f | afgveikz | "2026-06-22T02:17:30.934Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | aef70554-b535-4408-9407-946db41f772d | afgveikz | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | aef70554-b535-4408-9407-946db41f772d | afgveikz |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | aef70554-b535-4408-9407-946db41f772d | afgveikz | "2026-06-24T09:31:38.495Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | hzppst | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | hzppst |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | hzppst | "2026-07-06T13:43:34.273Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| profiles | password_hash | f7c50816-459c-4a6d-a782-fe498d1988e4 | afgveikz | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable |
| profiles | actif | f7c50816-459c-4a6d-a782-fe498d1988e4 | afgveikz |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif |
| profiles | updated_at | f7c50816-459c-4a6d-a782-fe498d1988e4 | afgveikz | "2026-06-25T04:40:12.601Z" | "2026-07-15T14:53:42.410Z" | GENERATED | timestamp differs from merged — ETL/ops overwrite |
| chantiers | heure_debut | 2797f122-d255-40a8-83e3-fe4d8c80a352 | afgveikz | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | 2797f122-d255-40a8-83e3-fe4d8c80a352 | afgveikz | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | 2797f122-d255-40a8-83e3-fe4d8c80a352 | afgveikz | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | 2797f122-d255-40a8-83e3-fe4d8c80a352 | afgveikz |  | "2026-06-23T03:37:45.575Z" | GENERATED | updated_at absent in merged; filled at ETL |
| chantiers | heure_debut | 34592189-ae34-4063-9bae-8d08b83719ff | hzppst | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | 34592189-ae34-4063-9bae-8d08b83719ff | hzppst | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | 34592189-ae34-4063-9bae-8d08b83719ff | hzppst | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | 34592189-ae34-4063-9bae-8d08b83719ff | hzppst |  | "2026-06-25T06:42:06.634Z" | GENERATED | updated_at absent in merged; filled at ETL |
| chantiers | heure_debut | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | hzppst | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | hzppst | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | hzppst | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | hzppst |  | "2026-06-25T09:38:12.160Z" | GENERATED | updated_at absent in merged; filled at ETL |
| chantiers | heure_debut | 9b4e164b-ca34-4d39-93ce-9641a475a11a | afgveikz | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | 9b4e164b-ca34-4d39-93ce-9641a475a11a | afgveikz | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | 9b4e164b-ca34-4d39-93ce-9641a475a11a | afgveikz | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | 9b4e164b-ca34-4d39-93ce-9641a475a11a | afgveikz |  | "2026-06-22T02:26:50.096Z" | GENERATED | updated_at absent in merged; filled at ETL |
| chantiers | heure_debut | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | afgveikz | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | afgveikz | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | afgveikz | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | afgveikz |  | "2026-06-22T02:24:03.507Z" | GENERATED | updated_at absent in merged; filled at ETL |
| chantiers | heure_debut | f63c0560-07a8-4070-9711-0fbbd750404d | hzppst | "07:30:00" | "07:30:00" | TRANSFORMED | exact clock of heure_debut found in heure_debut_matin |
| chantiers | heure_fin | f63c0560-07a8-4070-9711-0fbbd750404d | hzppst | "16:30:00" | {"fin_matin":"16:30:00","fin_apres":"16:30:00"} | TRANSFORMED | exact clock of heure_fin copied to both fin slots |
| chantiers | __hours_model__ | f63c0560-07a8-4070-9711-0fbbd750404d | hzppst | {"heure_debut":"07:30:00","heure_fin":"16:30:00"} | {"heure_debut_matin":"07:30:00","heure_fin_matin":"16:30:00","heure_debut_apres_midi":null,"heure_fin_apres_midi":"16:30:00"} | CAPABILITY_LOSS | Source is one continuous window. Destination 2-slot model forces apres_midi start=NULL; original schedule semantics not exactly reconstructible. |
| chantiers | updated_at | f63c0560-07a8-4070-9711-0fbbd750404d | hzppst |  | "2026-06-25T06:41:41.994Z" | GENERATED | updated_at absent in merged; filled at ETL |
| periodes_travail | latitude_debut | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 05a79907-1ef5-44df-88c3-5302d0c95782 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 05e3720a-9e64-4f34-b7cc-6ea1e64b78ae | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 0f256daa-126f-404c-b1d6-5160ccb21b1c | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 126410ae-27ec-48f3-a291-15b0555c2b42 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 211565ff-d91d-4374-b375-ca0c75afe66e | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 24b78a5a-b456-406a-b41b-e2c0263f12ca | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 29d15a18-7822-4924-aab7-acdf26a3191b | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 2d876443-1fb0-4832-bb11-a077c9e86f93 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 310c12c1-145e-408b-8770-0335b4d9a2cf | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 38697e6f-f480-4223-84d2-94868cb280b0 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 3b55aa2d-564c-472b-a416-174e76c4dacc | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 3c5142a9-70bb-4100-8a3b-29405270d88c | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 3dea0aed-3997-4ab0-ab52-2ad4de58a841 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | false | false | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 3e60c57b-d44c-4b4d-80f0-c42cbaba0723 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 3fbfae17-4d41-4b95-b51e-e9bc414f8db3 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 44503c24-7357-4b2d-9f63-ec4b11029006 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 4e8e1005-9813-4bc7-8081-4a090264f276 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 52ba9522-07a6-4caf-b75e-f9b09c4bb01b | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | false | false | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 58bc3424-cd58-4d36-8de8-e149d73705b8 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 5b61bda8-0405-42f7-b75a-f9993e8ac8ba | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 5ba5ae29-b9c4-4fc6-8f16-382572560b09 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 5cded969-5584-4767-986d-974dbcd3f51a | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 60130462-1584-4d3b-ac42-9674e31c621f | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 64367980-24c9-4944-8fb5-bc041fb19b6e | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 67b62aaf-e60f-4d35-8542-71a858778e9c | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 6c335a82-1412-4053-9591-414a52d6f80d | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 6f0fc149-91e1-485e-b5a5-d9f91cc53975 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 6fe8b225-e72a-464d-a51b-2529848a9ce5 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 7a9222d6-7143-4397-ab6c-622b65cf890e | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 8700fef2-83ee-45ef-abb4-f2e71e50baeb | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 88395f8a-c70e-4589-b790-3196f1552997 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 8c18258c-d98b-4933-a5f9-854950469619 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 8f35dec8-8d0a-499d-9240-a95c276a6082 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 99a58fc7-f6b0-45cd-bb27-b0e347af0a74 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 9c173268-595a-4ce9-87a1-b831e4c18e47 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | 9c88b198-eedf-4a02-b667-050f9868bff0 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | b00d8302-6b88-4923-9b13-297747ecf337 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | bafcdde6-8b6e-477e-b5f6-42c391387464 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | c891c531-c781-401a-a9c7-7b42ead5dd49 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | c93418e9-5d99-41ec-8db7-1e78dbe434ff | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | ca17c607-3754-4ea3-815f-4a166c4028bd | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | ceae7537-6751-4ea9-a358-b5aff800e440 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | cf38eead-1d53-4d09-b2f1-966e816a59dc | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | dabe2b6b-cd6f-4215-ab26-befeeaba2599 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | e037deb7-20ae-46c5-8407-e1ec1199f7a3 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | e61d74d6-36b5-4134-acc3-064778ef09bb | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | e989d730-2ad1-4269-9aea-f86610784c37 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | ed1a4203-df7d-4092-adac-bf43dc2872bc | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | ed640355-0897-4728-9323-a1a191506d86 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | f40c6bc8-d5bf-44dd-b7b5-245c0108953e | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | f57acb88-faa6-4c92-a73e-9daade3598aa | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | fcf5e723-8930-43c4-83f7-d0f094412a78 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| periodes_travail | latitude_debut | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | 0 | 0 | TRANSFORMED | latitude_debut equals local latitude |
| periodes_travail | longitude_debut | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | 0 | 0 | TRANSFORMED | longitude_debut equals local longitude |
| periodes_travail | latitude_fin | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | 0 | null | CAPABILITY_LOSS | latitude_fin discarded; value equals debut in this row — no unique value lost, but schema cannot store distinct end |
| periodes_travail | longitude_fin | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | 0 | null | CAPABILITY_LOSS | longitude_fin discarded; value equals debut — CAPABILITY LOSS |
| periodes_travail | __gps_model__ | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | {"latitude_debut":0,"longitude_debut":0,"latitude_fin":0,"longitude_fin":0} | {"latitude":0,"longitude":0} | CAPABILITY_LOSS | Schema: 4 GPS columns → 2. Current values identical/zero; destination cannot represent start≠end |
| periodes_travail | panier_repas | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | true | true | TRANSFORMED | panier_repas→panier exact boolean preserved |
| periodes_travail | commentaire | fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent from DDL — CAPABILITY LOSS (value null/empty) |
| declarations_heures | commentaire | 001509ff-9611-4c3a-bbc1-1e1a202479ea | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 009da677-8783-40c6-a1c9-ba49e3417c65 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 045f4fdf-8b36-4886-8ca2-2301abad12f2 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 0b6b955a-4206-4fda-9aa3-ffe4aff68cd2 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 1164884f-0f22-4a3e-86bb-0637f668e012 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 13e66a2c-262e-4fb3-a8b2-944be7d502df | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 15443add-c9da-49a4-90c1-e22edbb31d6a | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 1a71d186-1a8f-434e-98f3-77deca392d4a | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 1d323412-8d11-496c-9a38-10909b4efa1c | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 1d60d5ac-68f0-4a95-8ad9-be615db0d380 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 2403747a-5a67-45c5-b8fd-209701555fbc | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 2a740baf-c2c2-4697-920e-0b5bc64bacf4 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 2d3b9658-7d93-4ce0-b6cf-a4bb5752b284 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 2de58ee0-8142-423d-ae0d-f4bc3e2ecb04 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 32c20159-03c4-4e81-8139-1c918397dc25 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 3d2cfaa2-f23d-424a-be7f-12e24eee0165 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 4de0691f-28e2-413e-a56d-b9712e2f88a4 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 58eb7217-d4ba-4102-a9b6-f407f09a5dff | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 6087837c-a0f1-41fc-823f-aaaedf0b7e03 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 61984bb7-d384-4662-a47d-5676e4175c76 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 657c3ee4-ddac-488b-9e48-bf9e69ecb508 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 68cdcb17-7ce6-4c74-8bf9-37d30651c1c0 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 717c73d2-b0f3-433f-a5b1-ab08a1368513 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 73c6632b-550d-457e-bcee-736ae85266d6 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 7a1aef37-3453-4e8c-a2f7-ab5a917b92a5 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 7c60847a-540c-47bb-9ce2-29dc4be7592c | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 83ace382-75a7-4390-8511-f287928461b0 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 89b41680-b133-47eb-9510-eb79062c61d8 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 9698eb31-76c1-4a43-9cc9-ca6a86402f57 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 983d22b0-efb1-4f6e-949a-00098b1be06d | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | 9eff5ae0-eab2-42ef-b030-27e3bac88f9c | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a15d0a33-7a8e-43b6-a7d6-9c49185046f4 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a4b3919d-9232-4351-803a-66c7f7544d08 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a51ef76e-8e40-4288-9a0b-30dda9eeb795 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a5891093-71da-4c42-8a66-66d1c578f5bd | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a6b3eea9-8702-4faa-9cfa-ccda4885279d | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | a827696c-9b85-4c2a-9ac3-d984144e7216 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | aaba3ff2-e0c0-4c3a-9f11-267ab851da5c | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | b26f0fd2-05af-48b5-9f38-ad7805af4554 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | bcae952b-e4c2-4800-ab8c-044b6eafe0cc | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | bd04608e-5d96-4516-9311-03c36e3efb35 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | c1c7d171-9542-4c02-bb24-b372883ed8e5 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | ce5aa37f-2f66-4471-a51f-54186e005fe9 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | d0602828-2132-43f7-a53b-81af0d92dacb | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | d36aa7da-dd1b-41de-a65b-87b13272bda2 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | dbbc5b9c-2b65-4786-b0c4-18263a90cea3 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | dead0b27-d750-4577-92c6-dbf2593edb50 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | ea3d961e-def8-4f32-83b5-3e66f2e8540a | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | eb2b0e15-4200-4151-972a-1082f0f5fc04 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | ec563437-2c2c-4f29-8859-0d4e37cfd156 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | eea3035d-3c9a-4f2c-b94e-e67164ec2931 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | f261562f-160b-42d4-9bcc-0cba0196e345 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | f2d6b605-1f82-4a7f-bc2d-3d4b98d8ebc3 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | f3dbb9d2-ee49-4d67-986f-10054da1c666 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | fa9c3bac-2c1e-4bfd-bca2-c254556074c5 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | fc3a88cc-18de-4f8b-84df-a3982f32e7a0 | afgveikz | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |
| declarations_heures | commentaire | fd7a3de3-cdcd-4ca6-97d8-b2479026ddf6 | hzppst | null | null | CAPABILITY_LOSS | commentaire column absent — CAPABILITY LOSS |

## MATCH count by table

- **profiles**: 71 MATCH field comparisons (strict)
- **chantiers**: 48 MATCH field comparisons (strict)
- **affectations_chantiers**: 84 MATCH field comparisons (strict)
- **zones_equipe**: 0 MATCH field comparisons (strict)
- **zones_chantiers**: 0 MATCH field comparisons (strict)
- **zones_ouvriers**: 0 MATCH field comparisons (strict)
- **periodes_travail**: 767 MATCH field comparisons (strict)
- **declarations_heures**: 798 MATCH field comparisons (strict)
