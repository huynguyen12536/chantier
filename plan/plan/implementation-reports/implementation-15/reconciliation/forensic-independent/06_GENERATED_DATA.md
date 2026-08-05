# 06_GENERATED_DATA.md

**Compared at:** 2026-07-16T01:32:38.937Z

| table | id | column | source | dest | reason | severity | recovery |
|---|---|---|---|---|---|---|---|
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | updated_at | "2026-07-06T13:42:41.943Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | updated_at | "2026-06-18T08:38:27.151Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | updated_at | "2026-06-25T08:21:49.203Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | updated_at | "2026-06-19T02:54:59.773Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | updated_at | "2026-06-25T08:22:47.803Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | updated_at | "2026-06-22T02:17:30.934Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | aef70554-b535-4408-9407-946db41f772d | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | aef70554-b535-4408-9407-946db41f772d | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | aef70554-b535-4408-9407-946db41f772d | updated_at | "2026-06-24T09:31:38.495Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | updated_at | "2026-07-06T13:43:34.273Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | password_hash | null | "$2b$10$…" | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | CRITICAL | Export auth.users from both Supabase projects OR force password reset |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | actif |  | true | COALESCE(..., TRUE) — merged had no actif | LOW | Document or remove default if false business claim |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | updated_at | "2026-06-25T04:40:12.601Z" | "2026-07-15T14:53:42.410Z" | timestamp differs from merged — ETL/ops overwrite | MEDIUM | Re-import timestamps from merged if required |
| profiles | 00000000-0000-4000-8000-000000000001 | *row* | null | "system.auto-approve@platform.local" | ETL ensureSystemActor — not from Supabase | LOW | Keep as platform requirement |
| chantiers | 2797f122-d255-40a8-83e3-fe4d8c80a352 | updated_at |  | "2026-06-23T03:37:45.575Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
| chantiers | 34592189-ae34-4063-9bae-8d08b83719ff | updated_at |  | "2026-06-25T06:42:06.634Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
| chantiers | 5294fce8-3d77-40c7-8d5d-ab341f0e926f | updated_at |  | "2026-06-25T09:38:12.160Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
| chantiers | 9b4e164b-ca34-4d39-93ce-9641a475a11a | updated_at |  | "2026-06-22T02:26:50.096Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
| chantiers | bb17663c-2e02-4e79-8763-eecf3f3aeee4 | updated_at |  | "2026-06-22T02:24:03.507Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
| chantiers | f63c0560-07a8-4070-9711-0fbbd750404d | updated_at |  | "2026-06-25T06:41:41.994Z" | updated_at absent in merged; filled at ETL | LOW | Document or remove default if false business claim |
