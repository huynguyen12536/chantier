# ROW_LEVEL_DIFF.md

**Compared at:** 2026-07-15T15:07:04.640Z

Every matching UUID with ≥1 field difference (vs merged). Exact matches omitted.

## profiles (9 mismatched IDs / 9 matching)

### `05fae8ca-461d-480a-9ee0-8ee80cc0e85f`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-07-06T13:42:41.943Z" | UNEXPLAINED |

### `1200f3b8-b1d0-44ea-a75d-60f10993477b`

| column | local | merged | class |
|---|---|---|---|
| matricule | null | "" | SAFE_TRANSFORM |
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-18T08:38:27.151Z" | UNEXPLAINED |

### `1d5ac48f-9eae-452a-a998-1b480f87ce18`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-25T08:21:49.203Z" | UNEXPLAINED |

### `47c68c11-eff5-4ba3-9368-252c38d30825`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-19T02:54:59.773Z" | UNEXPLAINED |

### `5609a530-0e12-4e78-8104-d810cae90075`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-25T08:22:47.803Z" | UNEXPLAINED |

### `abcca969-52ff-40fc-902d-82de4743462f`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-22T02:17:30.934Z" | UNEXPLAINED |

### `aef70554-b535-4408-9407-946db41f772d`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-24T09:31:38.495Z" | UNEXPLAINED |

### `eb5d70b5-0e89-49df-8254-01eaaf25ad3e`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-07-06T13:43:34.273Z" | UNEXPLAINED |

### `f7c50816-459c-4a6d-a782-fe498d1988e4`

| column | local | merged | class |
|---|---|---|---|
| updated_at | "2026-07-15T14:53:42.410Z" | "2026-06-25T04:40:12.601Z" | UNEXPLAINED |

## chantiers (6 mismatched IDs / 6 matching)

### `2797f122-d255-40a8-83e3-fe4d8c80a352`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-22" | "2026-06-23" | MAPPING_BUG |
| date_fin | "2026-07-29" | "2026-07-30" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

### `34592189-ae34-4063-9bae-8d08b83719ff`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | MAPPING_BUG |
| date_fin | "2026-08-27" | "2026-08-28" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

### `5294fce8-3d77-40c7-8d5d-ab341f0e926f`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | MAPPING_BUG |
| date_fin | "2026-07-30" | "2026-07-31" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

### `9b4e164b-ca34-4d39-93ce-9641a475a11a`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | MAPPING_BUG |
| date_fin | "2026-08-26" | "2026-08-27" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

### `bb17663c-2e02-4e79-8763-eecf3f3aeee4`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | MAPPING_BUG |
| date_fin | "2026-07-30" | "2026-07-31" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

### `f63c0560-07a8-4070-9711-0fbbd750404d`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | MAPPING_BUG |
| date_fin | "2026-07-23" | "2026-07-24" | MAPPING_BUG |
| heure_debut | null | "07:30:00" | EXPECTED_TRANSFORM |
| heure_fin | null | "16:30:00" | EXPECTED_TRANSFORM |

## affectations_chantiers (12 mismatched IDs / 12 matching)

### `0b3d4154-3a7b-4a1e-abb3-43160f3977de`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |

### `0c4ceac7-c746-4c13-8afc-3726a1f3c929`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | UNEXPLAINED |

### `1af9b818-e831-4b45-9b83-c28228a7c9a6`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |

### `40e333e3-8469-4a79-9d0f-f6e53815a646`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |
| date_fin | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `44b2c006-e790-43fa-a7ea-b3b0d26ae336`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | UNEXPLAINED |

### `45da7866-31fb-4326-a1cb-a4df4801665d`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |
| date_fin | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `7b4983f3-d404-49ee-be97-1cd42558aa12`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | UNEXPLAINED |

### `9094000c-ef7e-4c69-babb-084d63c26c7c`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-21" | "2026-06-22" | UNEXPLAINED |

### `95f0a374-3976-4d6b-ae29-9411cdbbf6d1`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-22" | "2026-06-23" | UNEXPLAINED |

### `dcd94104-963b-424e-b758-517b43507687`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-22" | "2026-06-23" | UNEXPLAINED |

### `eaac69c5-ca5a-4628-b7a3-185382271d84`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |
| date_fin | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `f5a06934-c038-42d9-b894-1050a81a41a5`

| column | local | merged | class |
|---|---|---|---|
| date_debut | "2026-06-24" | "2026-06-25" | UNEXPLAINED |

## zones_equipe (0 mismatched IDs / 0 matching)

_No field mismatches (or table empty)._

## zones_chantiers (0 mismatched IDs / 0 matching)

_No field mismatches (or table empty)._

## zones_ouvriers (0 mismatched IDs / 0 matching)

_No field mismatches (or table empty)._

## periodes_travail (59 mismatched IDs / 59 matching)

### `05076fdb-6faf-4b8b-a91b-1219ae7c62c6`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `05a79907-1ef5-44df-88c3-5302d0c95782`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `05e3720a-9e64-4f34-b7cc-6ea1e64b78ae`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `0aa9d2a6-b5fd-4f19-9a59-53ce87eb967d`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `0f256daa-126f-404c-b1d6-5160ccb21b1c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-28" | "2026-06-29" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `126410ae-27ec-48f3-a291-15b0555c2b42`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-22" | "2026-07-23" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `211565ff-d91d-4374-b375-ca0c75afe66e`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-29" | "2026-06-30" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `24b78a5a-b456-406a-b41b-e2c0263f12ca`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-22" | "2026-06-23" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `29d15a18-7822-4924-aab7-acdf26a3191b`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `2d876443-1fb0-4832-bb11-a077c9e86f93`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `310c12c1-145e-408b-8770-0335b4d9a2cf`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-17" | "2026-07-18" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `38697e6f-f480-4223-84d2-94868cb280b0`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `3b55aa2d-564c-472b-a416-174e76c4dacc`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-25" | "2026-06-26" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `3c5142a9-70bb-4100-8a3b-29405270d88c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-11" | "2026-07-12" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `3dea0aed-3997-4ab0-ab52-2ad4de58a841`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `3e60c57b-d44c-4b4d-80f0-c42cbaba0723`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-23" | "2026-07-24" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | false | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `3fbfae17-4d41-4b95-b51e-e9bc414f8db3`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `44503c24-7357-4b2d-9f63-ec4b11029006`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `4e8e1005-9813-4bc7-8081-4a090264f276`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `52ba9522-07a6-4caf-b75e-f9b09c4bb01b`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-16" | "2026-07-17" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `58bc3424-cd58-4d36-8de8-e149d73705b8`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-26" | "2026-07-27" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | false | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `5b61bda8-0405-42f7-b75a-f9993e8ac8ba`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `5ba5ae29-b9c4-4fc6-8f16-382572560b09`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-27" | "2026-06-28" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `5cded969-5584-4767-986d-974dbcd3f51a`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-15" | "2026-07-16" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `60130462-1584-4d3b-ac42-9674e31c621f`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `64367980-24c9-4944-8fb5-bc041fb19b6e`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-22" | "2026-07-23" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `67b62aaf-e60f-4d35-8542-71a858778e9c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `6c335a82-1412-4053-9591-414a52d6f80d`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `6f0fc149-91e1-485e-b5a5-d9f91cc53975`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `6fe8b225-e72a-464d-a51b-2529848a9ce5`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `7a9222d6-7143-4397-ab6c-622b65cf890e`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-10" | "2026-07-11" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `8700fef2-83ee-45ef-abb4-f2e71e50baeb`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-19" | "2026-07-20" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `88395f8a-c70e-4589-b790-3196f1552997`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `8c18258c-d98b-4933-a5f9-854950469619`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `8f35dec8-8d0a-499d-9240-a95c276a6082`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `99a58fc7-f6b0-45cd-bb27-b0e347af0a74`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `9c173268-595a-4ce9-87a1-b831e4c18e47`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-21" | "2026-06-22" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `9c88b198-eedf-4a02-b667-050f9868bff0`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-15" | "2026-07-16" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `b00d8302-6b88-4923-9b13-297747ecf337`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `bafcdde6-8b6e-477e-b5f6-42c391387464`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-30" | "2026-07-01" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `c891c531-c781-401a-a9c7-7b42ead5dd49`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `c93418e9-5d99-41ec-8db7-1e78dbe434ff`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-18" | "2026-07-19" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `ca17c607-3754-4ea3-815f-4a166c4028bd`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `ceae7537-6751-4ea9-a358-b5aff800e440`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `cf38eead-1d53-4d09-b2f1-966e816a59dc`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `d9991393-fba3-4525-ab1a-cd4ccc7e24fa`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `dabe2b6b-cd6f-4215-ab26-befeeaba2599`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-21" | "2026-07-22" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `db0a23a9-e474-4658-bcb1-3fd09dd814c1`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `e037deb7-20ae-46c5-8407-e1ec1199f7a3`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `e61d74d6-36b5-4134-acc3-064778ef09bb`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `e989d730-2ad1-4269-9aea-f86610784c37`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-21" | "2026-07-22" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `ed1a4203-df7d-4092-adac-bf43dc2872bc`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `ed640355-0897-4728-9323-a1a191506d86`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `f40c6bc8-d5bf-44dd-b7b5-245c0108953e`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-26" | "2026-06-27" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `f57acb88-faa6-4c92-a73e-9daade3598aa`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `fcf5e723-8930-43c4-83f7-d0f094412a78`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-23" | "2026-06-24" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

### `fd38afb4-10ef-4ad4-a6e3-f4fdda6e9e0b`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-23" | "2026-07-24" | UNEXPLAINED |
| latitude_debut | null | 0 | EXPECTED_TRANSFORM |
| longitude_debut | null | 0 | EXPECTED_TRANSFORM |
| latitude_fin | null | 0 | EXPECTED_TRANSFORM |
| longitude_fin | null | 0 | EXPECTED_TRANSFORM |
| panier_repas | null | true | EXPECTED_TRANSFORM |
| __gps_map__ | {"latitude":0,"longitude":0} | {"lat_d":0,"lat_f":0,"lon_d":0,"lon_f":0} | EXPECTED_TRANSFORM |

## declarations_heures (57 mismatched IDs / 57 matching)

### `001509ff-9611-4c3a-bbc1-1e1a202479ea`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |

### `009da677-8783-40c6-a1c9-ba49e3417c65`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |

### `045f4fdf-8b36-4886-8ca2-2301abad12f2`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-11" | "2026-07-12" | UNEXPLAINED |

### `0b6b955a-4206-4fda-9aa3-ffe4aff68cd2`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-26" | "2026-06-27" | UNEXPLAINED |

### `1164884f-0f22-4a3e-86bb-0637f668e012`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |

### `13e66a2c-262e-4fb3-a8b2-944be7d502df`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |

### `15443add-c9da-49a4-90c1-e22edbb31d6a`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |

### `1a71d186-1a8f-434e-98f3-77deca392d4a`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-22" | "2026-07-23" | UNEXPLAINED |

### `1d323412-8d11-496c-9a38-10909b4efa1c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-15" | "2026-07-16" | UNEXPLAINED |

### `1d60d5ac-68f0-4a95-8ad9-be615db0d380`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `2403747a-5a67-45c5-b8fd-209701555fbc`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-29" | "2026-06-30" | UNEXPLAINED |

### `2a740baf-c2c2-4697-920e-0b5bc64bacf4`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-27" | "2026-06-28" | UNEXPLAINED |

### `2d3b9658-7d93-4ce0-b6cf-a4bb5752b284`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `2de58ee0-8142-423d-ae0d-f4bc3e2ecb04`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-07" | "2026-07-08" | UNEXPLAINED |

### `32c20159-03c4-4e81-8139-1c918397dc25`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |

### `3d2cfaa2-f23d-424a-be7f-12e24eee0165`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |

### `4de0691f-28e2-413e-a56d-b9712e2f88a4`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-21" | "2026-07-22" | UNEXPLAINED |

### `58eb7217-d4ba-4102-a9b6-f407f09a5dff`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |

### `6087837c-a0f1-41fc-823f-aaaedf0b7e03`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |

### `61984bb7-d384-4662-a47d-5676e4175c76`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-23" | "2026-07-24" | UNEXPLAINED |

### `657c3ee4-ddac-488b-9e48-bf9e69ecb508`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |

### `68cdcb17-7ce6-4c74-8bf9-37d30651c1c0`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-10" | "2026-07-11" | UNEXPLAINED |

### `717c73d2-b0f3-433f-a5b1-ab08a1368513`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |

### `73c6632b-550d-457e-bcee-736ae85266d6`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |

### `7a1aef37-3453-4e8c-a2f7-ab5a917b92a5`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-15" | "2026-07-16" | UNEXPLAINED |

### `7c60847a-540c-47bb-9ce2-29dc4be7592c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |

### `83ace382-75a7-4390-8511-f287928461b0`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-21" | "2026-06-22" | UNEXPLAINED |

### `89b41680-b133-47eb-9510-eb79062c61d8`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |

### `9698eb31-76c1-4a43-9cc9-ca6a86402f57`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-22" | "2026-06-23" | UNEXPLAINED |

### `983d22b0-efb1-4f6e-949a-00098b1be06d`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |

### `9eff5ae0-eab2-42ef-b030-27e3bac88f9c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-12" | "2026-07-13" | UNEXPLAINED |

### `a15d0a33-7a8e-43b6-a7d6-9c49185046f4`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |

### `a4b3919d-9232-4351-803a-66c7f7544d08`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-17" | "2026-07-18" | UNEXPLAINED |

### `a51ef76e-8e40-4288-9a0b-30dda9eeb795`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |

### `a5891093-71da-4c42-8a66-66d1c578f5bd`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-09" | "2026-07-10" | UNEXPLAINED |

### `a6b3eea9-8702-4faa-9cfa-ccda4885279d`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |

### `a827696c-9b85-4c2a-9ac3-d984144e7216`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-23" | "2026-06-24" | UNEXPLAINED |

### `aaba3ff2-e0c0-4c3a-9f11-267ab851da5c`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-19" | "2026-07-20" | UNEXPLAINED |

### `b26f0fd2-05af-48b5-9f38-ad7805af4554`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |

### `bcae952b-e4c2-4800-ab8c-044b6eafe0cc`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |

### `bd04608e-5d96-4516-9311-03c36e3efb35`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-21" | "2026-07-22" | UNEXPLAINED |

### `c1c7d171-9542-4c02-bb24-b372883ed8e5`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-13" | "2026-07-14" | UNEXPLAINED |

### `ce5aa37f-2f66-4471-a51f-54186e005fe9`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |

### `d0602828-2132-43f7-a53b-81af0d92dacb`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-14" | "2026-07-15" | UNEXPLAINED |

### `d36aa7da-dd1b-41de-a65b-87b13272bda2`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |

### `dbbc5b9c-2b65-4786-b0c4-18263a90cea3`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-26" | "2026-07-27" | UNEXPLAINED |

### `dead0b27-d750-4577-92c6-dbf2593edb50`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-25" | "2026-06-26" | UNEXPLAINED |

### `ea3d961e-def8-4f32-83b5-3e66f2e8540a`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-22" | "2026-07-23" | UNEXPLAINED |

### `eb2b0e15-4200-4151-972a-1082f0f5fc04`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-30" | "2026-07-01" | UNEXPLAINED |

### `ec563437-2c2c-4f29-8859-0d4e37cfd156`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-20" | "2026-07-21" | UNEXPLAINED |

### `eea3035d-3c9a-4f2c-b94e-e67164ec2931`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-06-28" | "2026-06-29" | UNEXPLAINED |

### `f261562f-160b-42d4-9bcc-0cba0196e345`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-16" | "2026-07-17" | UNEXPLAINED |

### `f2d6b605-1f82-4a7f-bc2d-3d4b98d8ebc3`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |

### `f3dbb9d2-ee49-4d67-986f-10054da1c666`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-05" | "2026-07-06" | UNEXPLAINED |

### `fa9c3bac-2c1e-4bfd-bca2-c254556074c5`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-06" | "2026-07-07" | UNEXPLAINED |

### `fc3a88cc-18de-4f8b-84df-a3982f32e7a0`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-18" | "2026-07-19" | UNEXPLAINED |

### `fd7a3de3-cdcd-4ca6-97d8-b2479026ddf6`

| column | local | merged | class |
|---|---|---|---|
| date | "2026-07-08" | "2026-07-09" | UNEXPLAINED |

