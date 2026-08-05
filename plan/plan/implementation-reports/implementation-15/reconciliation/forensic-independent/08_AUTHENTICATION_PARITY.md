# 08_AUTHENTICATION_PARITY.md

**Compared at:** 2026-07-16T01:32:38.937Z

## Rule

Public profiles ≠ authentication. Never MATCH without auth.users evidence.

## Probes

| Probe | Result |
|---|---|
| auth schema local | false |
| auth.users | false (n=null) |
| auth.identities | false |
| refresh_tokens | 4 |
| auth in A/B/merged dumps | false |
| ETL temp password | Phase15-TempPass! |
| Original login | **NO** |
| LOST AUTHENTICATION | **9** |

## Users

| id | email | status | severity | reason | recovery |
|---|---|---|---|---|---|
| 00000000-0000-4000-8000-000000000001 | system.auto-approve@platform.local | GENERATED | LOW | system actor | n/a |
| 47c68c11-eff5-4ba3-9368-252c38d30825 | nguyenthikieunghi.ltp202@gmail.com | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| 1200f3b8-b1d0-44ea-a75d-60f10993477b | joseph.ad@arson-concept.ch | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| aef70554-b535-4408-9407-946db41f772d | jasmine.tl@gmail.com | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| f7c50816-459c-4a6d-a782-fe498d1988e4 | jasmine.collab@gmail.com | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| abcca969-52ff-40fc-902d-82de4743462f | jasmine.n@gmail.com | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| 5609a530-0e12-4e78-8104-d810cae90075 | joseph.collab@arson-concept.ch | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | la@yahoo.fr | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| eb5d70b5-0e89-49df-8254-01eaaf25ad3e | ap@gmail.com | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
| 1d5ac48f-9eae-452a-a998-1b480f87ce18 | joseph.tl@arson-concept.ch | LOST_AUTHENTICATION | CRITICAL | auth.users / identities / provider not in dumps; hash synthetic | Re-export auth.users or force reset |
