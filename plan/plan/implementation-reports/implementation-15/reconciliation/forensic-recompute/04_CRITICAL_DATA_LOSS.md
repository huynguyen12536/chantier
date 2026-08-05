# 04 — Critical Data Loss

Only items where business information cannot be reconstructed.

## LOST_AUTHENTICATION (all users)

| Evidence | Detail |
|----------|--------|
| Source dumps | No `auth.users`, identities, encrypted_password |
| Merged | No password material on any profile |
| Local | 9 business profiles have GENERATED bcrypt hashes |
| Consequence | **No original Supabase credential can authenticate** |

## LOST — identity attributes on email collision

Email `joseph.ad@arson-concept.ch`: hzppst profile discarded.

| Field | Discarded value | Kept value | Recoverable from local? |
|-------|-----------------|------------|-------------------------|
| nom | "Arson" | "Asron" | NO |
| matricule | "USR750160" | "" | NO |
| phone | "+33234234234" | "+33342342354" | NO |
| created_at | "2026-06-25T06:25:50.653741+00:00" | "2026-06-18T08:38:27.151274+00:00" | NO |
| updated_at | "2026-06-25T06:25:50.653741+00:00" | "2026-06-18T08:38:27.151274+00:00" | NO |

## LOST — GPS end (when distinct)

Distinct start/end losses observed: **0**  
(Current dataset: end equals start on 59/59 periodes — numeric loss not triggered, but see capability report.)

## LOST — non-empty comments

Periodes nonempty discarded: **0**  
Declarations nonempty discarded: **0**

## Other critical findings

- [LOST_AUTHENTICATION] profiles 47c68c11-eff5-4ba3-9368-252c38d30825 — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles 1200f3b8-b1d0-44ea-a75d-60f10993477b — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles aef70554-b535-4408-9407-946db41f772d — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles f7c50816-459c-4a6d-a782-fe498d1988e4 — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles abcca969-52ff-40fc-902d-82de4743462f — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles 5609a530-0e12-4e78-8104-d810cae90075 — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles 05fae8ca-461d-480a-9ee0-8ee80cc0e85f — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles eb5d70b5-0e89-49df-8254-01eaaf25ad3e — Original Supabase credentials not reconstructible; temp password hash generated
- [LOST_AUTHENTICATION] profiles 1d5ac48f-9eae-452a-a998-1b480f87ce18 — Original Supabase credentials not reconstructible; temp password hash generated
