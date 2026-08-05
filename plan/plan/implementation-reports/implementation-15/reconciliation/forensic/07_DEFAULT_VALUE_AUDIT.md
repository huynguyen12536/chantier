# 07_DEFAULT_VALUE_AUDIT.md

**Compared at:** 2026-07-16T01:21:43.040Z

NULL ≠ '' ≠ false ≠ 0 ≠ generated default.

| table | id | field | source | dest | reason | impact | severity |
|---|---|---|---|---|---|---|---|
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | aef70554-b535-4408-9407-946db41f772d | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | actif | null | true | merged has no actif; local COALESCE(..., TRUE) | Not from source of truth | LOW |
| chantiers | 2797f122-d255-40a8-83e3-fe4d8c80a352 | updated_at | null | "2026-06-23T03:37:45.575Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |
| chantiers | 34592189-ae34-4063-9bae-8d08b83719ff | updated_at | null | "2026-06-25T06:42:06.634Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |
| chantiers | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | updated_at | null | "2026-06-25T09:38:12.160Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |
| chantiers | 9b4e164b-ca34-4d39-93ce-9641a475a11a | updated_at | null | "2026-06-22T02:26:50.096Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |
| chantiers | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | updated_at | null | "2026-06-22T02:24:03.507Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |
| chantiers | f63c0560-07a8-4070-9711-0fbbd750404d | updated_at | null | "2026-06-25T06:41:41.994Z" | updated_at absent in merged dump; filled at ETL | Not from source of truth | LOW |

## Hidden corruption findings

Count: 0

_No whitespace/case/kind-coercion corruption beyond classified MODIFIED/GENERATED._
