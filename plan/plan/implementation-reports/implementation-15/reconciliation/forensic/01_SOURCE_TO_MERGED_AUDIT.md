# 01_SOURCE_TO_MERGED_AUDIT.md

**Forensic audit — READ ONLY**  
**Compared at:** 2026-07-16T01:21:43.040Z  
**Sources:** A=`afgveikz/afgveikzneaablcuzwdb` (extracted 2026-07-15T14:44:34.754Z) · B=`hzppst/hzppsttpzzeuslnpcdkv` (extracted 2026-07-15T14:44:36.373Z)  
**Target:** merged.json (merged_at 2026-07-15T14:44:39.255Z)

## Method

For every source row: COPIED | MERGED | OVERWRITTEN | DISCARDED | GENERATED | UNKNOWN  
Evidence from dump-and-merge policy + byte/field compare. No assumptions.

## Collision audit (from merged_audit.json)

```json
[
  {
    "type": "profile_email_collision",
    "email": "joseph.ad@arson-concept.ch",
    "discarded_id": "00ff4c88-626c-44a3-93b2-e6964af2ad73",
    "kept_id": "1200f3b8-b1d0-44ea-a75d-60f10993477b",
    "discarded_source": "hzppst"
  }
]
```

## Per-table source row classifications

| Table | COPIED | MERGED | OVERWRITTEN | DISCARDED | GENERATED | UNKNOWN |
|---|---:|---:|---:|---:|---:|---:|
| profiles | 9 | 0 | 0 | 1 | 0 | 0 |
| chantiers | 6 | 0 | 0 | 0 | 0 | 0 |
| affectations_chantiers | 12 | 0 | 0 | 0 | 0 | 0 |
| zones_equipe | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_chantiers | 0 | 0 | 0 | 0 | 0 | 0 |
| zones_ouvriers | 0 | 0 | 0 | 0 | 0 | 0 |
| periodes_travail | 45 | 14 | 0 | 0 | 0 | 0 |
| declarations_heures | 43 | 14 | 0 | 0 | 0 | 0 |

## Email collision — EVERY discarded field (never summarized)

| field | discarded_id (B) | kept_id (A) | discarded_value | discarded_kind | kept_value | kept_kind | merged_value | equal? | lost? | why kept | why discarded | severity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| created_at | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "2026-06-25T06:25:50.653Z" | ts | "2026-06-18T08:38:27.151Z" | ts | "2026-06-18T08:38:27.151Z" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | MEDIUM |
| email | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "joseph.ad@arson-concept.ch" | text | "joseph.ad@arson-concept.ch" | text | "joseph.ad@arson-concept.ch" | true | false | identical on both sources; kept A (first-wins) value | duplicate equal value collapsed | LOW |
| id | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "00ff4c88-626c-44a3-93b2-e6964af2ad73" | text | "1200f3b8-b1d0-44ea-a75d-60f10993477b" | text | "1200f3b8-b1d0-44ea-a75d-60f10993477b" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | MEDIUM |
| matricule | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "USR750160" | text | "" | empty | "" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | CRITICAL |
| nom | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "Arson" | text | "Asron" | text | "Asron" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | CRITICAL |
| phone | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "+33234234234" | text | "+33342342354" | text | "+33342342354" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | CRITICAL |
| prenom | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "Joseph" | text | "Joseph" | text | "Joseph" | true | false | identical on both sources; kept A (first-wins) value | duplicate equal value collapsed | LOW |
| role | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "admin" | text | "admin" | text | "admin" | true | false | identical on both sources; kept A (first-wins) value | duplicate equal value collapsed | LOW |
| updated_at | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | 1200f3b8-b1d0-44ea-a75d-60f10993477b | "2026-06-25T06:25:50.653Z" | ts | "2026-06-18T08:38:27.151Z" | ts | "2026-06-18T08:38:27.151Z" | false | true | first-wins merge kept source A (1200f3b8-b1d0-44ea-a75d-60f10993477b) value; discarded source B value | email collision policy: keep afgveikz profile, discard hzppst profile row | MEDIUM |

## Source rows classified DISCARDED / UNKNOWN / MERGED (non-copy)

| table | source | id | classification | evidence |
|---|---|---|---|---|
| profiles | B | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | DISCARDED | email collision: profile discarded; FKs remapped to 1200f3b8-b1d0-44ea-a75d-60f10993477b |
| periodes_travail | B | 38697e6f-f480-4223-84d2-94868cb280b0 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | db0a23a9-e474-4658-bcb1-3fd09dd814c1 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 88395f8a-c70e-4589-b790-3196f1552997 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 05076fdb-6faf-4b8b-a91b-1219ae7c62c6 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | ed1a4203-df7d-4092-adac-bf43dc2872bc | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | e62c8fd1-6e5b-42af-8bbf-c09c6a7a0218 | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 8f35dec8-8d0a-499d-9240-a95c276a6082 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 67b62aaf-e60f-4d35-8542-71a858778e9c | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | cf38eead-1d53-4d09-b2f1-966e816a59dc | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 6c335a82-1412-4053-9591-414a52d6f80d | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | d9991393-fba3-4525-ab1a-cd4ccc7e24fa | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | dc98857b-9068-4eaa-92b3-3fcb2ac1cc8f | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 05a79907-1ef5-44df-88c3-5302d0c95782 | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| periodes_travail | B | 58bc3424-cd58-4d36-8de8-e149d73705b8 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | dbbc5b9c-2b65-4786-b0c4-18263a90cea3 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | 3d2cfaa2-f23d-424a-be7f-12e24eee0165 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | 15443add-c9da-49a4-90c1-e22edbb31d6a | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | a6b3eea9-8702-4faa-9cfa-ccda4885279d | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | 2d3b9658-7d93-4ce0-b6cf-a4bb5752b284 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | fa9c3bac-2c1e-4bfd-bca2-c254556074c5 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | f3dbb9d2-ee49-4d67-986f-10054da1c666 | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | a5891093-71da-4c42-8a66-66d1c578f5bd | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | fd7a3de3-cdcd-4ca6-97d8-b2479026ddf6 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | 2de58ee0-8142-423d-ae0d-f4bc3e2ecb04 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | a51ef76e-8e40-4288-9a0b-30dda9eeb795 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | d36aa7da-dd1b-41de-a65b-87b13272bda2 | MERGED | row COPIED with FK remap: [{"fk":"validated_by","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | a15d0a33-7a8e-43b6-a7d6-9c49185046f4 | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
| declarations_heures | B | 657c3ee4-ddac-488b-9e48-bf9e69ecb508 | MERGED | row COPIED with FK remap: [{"fk":"user_id","from":"00ff4c88-626c-44a3-93b2-e6964af2ad73","to":"1200f3b8-b1d0-44ea-a75d-60f10993477b"}] |
