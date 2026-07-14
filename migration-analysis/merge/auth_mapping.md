# Authentication Mapping

| CVL behavior | Unified Platform mapping | Contract/provenance |
|---|---|---|
| Email/password sign-in returns a Supabase session | retain compatible authentication/session boundary during frozen-frontend period | `auth-flow.md` §2 |
| `auth.users.id` is 1:1 with `profiles.id` | map external identity to Workforce Member | auth flow §1; ER §1 |
| Role is read from profile, not JWT custom claims | centralized authorization may consume mapped role, while preserving observable access | auth flow §6 |
| Admin/administratif provision; admin deletes | lifecycle authorization rule preserved | auth flow §3–4 |
| No auth-user profile trigger | provisioning remains explicit/transactional; do not assume trigger | auth flow §5 |
| Local sign-out | preserve client-visible sign-out behavior | auth flow §2 |

No CVL evidence supports tenant claims, Super Admin credentials, company bootstrap, or a second identity system. Those are deferred extension points.
