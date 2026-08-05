# 08_AUTHENTICATION_PARITY.md

**Compared at:** 2026-07-16T01:21:43.040Z

## Rule

Public `profiles` ≠ authentication parity.  
Never MATCH for password/auth when auth.users cannot be reconstructed.

## Evidence

| Probe | Result |
|---|---|
| auth schema in local PG | false |
| auth.users table | false |
| auth.users count | n/a |
| refresh_tokens count | 4 |
| Supabase auth in A/B/merged dumps | **false** |
| Dump evidence | afgveikz.json / hzppst.json / merged.json contain public tables only — no auth.users, no identities, no provider metadata |
| ETL temp password policy | Phase15-TempPass! |
| Original login possible | **NO** |
| LOST AUTHENTICATION users | **9** |

## Users

| id | email | role | status | severity | evidence |
|---|---|---|---|---|---|
| 00000000-0000-4000-8000-000000000001 | system.auto-approve@platform.local | admin | GENERATED | LOW | system actor — not from Supabase |
| 47c68c11-eff5-4ba3-9368-252c38d30825 | nguyenthikieunghi.ltp202@gmail.com | admin | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| 1200f3b8-b1d0-44ea-a75d-60f10993477b | joseph.ad@arson-concept.ch | admin | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| aef70554-b535-4408-9407-946db41f772d | jasmine.tl@gmail.com | chef_equipe | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| f7c50816-459c-4a6d-a782-fe498d1988e4 | jasmine.collab@gmail.com | ouvrier | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| abcca969-52ff-40fc-902d-82de4743462f | jasmine.n@gmail.com | admin | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| 5609a530-0e12-4e78-8104-d810cae90075 | joseph.collab@arson-concept.ch | ouvrier | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | la@yahoo.fr | ouvrier | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| eb5d70b5-0e89-49df-8254-01eaaf25ad3e | ap@gmail.com | ouvrier | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |
| 1d5ac48f-9eae-452a-a998-1b480f87ce18 | joseph.tl@arson-concept.ch | chef_equipe | LOST_AUTHENTICATION | CRITICAL | auth.users not in source dumps; password_hash synthetic; provider metadata absent |

## Recovery possibility

| Option | Feasibility |
|---|---|
| Re-export auth.users from both Supabase projects (service role) | Possible if projects still exist |
| Force password reset for all users | Possible; loses original secrets permanently |
| Reconstruct hashes from dumps | **Impossible** — never dumped |
