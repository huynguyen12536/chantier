# 04_CRITICAL_DATA_LOSS.md

**Compared at:** 2026-07-16T01:32:38.937Z

| severity | table | id | column | source | dest | classification | reason | recovery |
|---|---|---|---|---|---|---|---|---|
| CRITICAL | profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | 5609a530-0e12-4e78-8104-d810cae90075 | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | abcca969-52ff-40fc-902d-82de4743462f | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | aef70554-b535-4408-9407-946db41f772d | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| CRITICAL | profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | password_hash | null | "$2b$10$…" | LOST_AUTHENTICATION | auth.users absent from A/B/merged dumps; local hash is ETL/ops generated — original login not recoverable | Export auth.users from both Supabase projects OR force password reset |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | created_at | "2026-06-25T06:25:50.653Z" | "2026-06-18T08:38:27.151Z" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="2026-06-18T08:38:27.151Z" | Restore field from hzppst dump / re-merge with field-level policy |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | id | "00ff4c88-626c-44a3-93b2-e6964af2ad73" | "1200f3b8-b1d0-44ea-a75d-60f10993477b" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="1200f3b8-b1d0-44ea-a75d-60f10993477b" | Restore field from hzppst dump / re-merge with field-level policy |
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | matricule | "USR750160" | "" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="" | Restore field from hzppst dump / re-merge with field-level policy |
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | nom | "Arson" | "Asron" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="Asron" | Restore field from hzppst dump / re-merge with field-level policy |
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | phone | "+33234234234" | "+33342342354" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="+33342342354" | Restore field from hzppst dump / re-merge with field-level policy |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | updated_at | "2026-06-25T06:25:50.653Z" | "2026-06-18T08:38:27.151Z" | LOST | email collision: hzppst profile row discarded; FKs remapped to kept id; kept="2026-06-18T08:38:27.151Z" | Restore field from hzppst dump / re-merge with field-level policy |

## Auth (always critical when lost)

LOST AUTHENTICATION: **9** — see 08.
