# Edge Functions Mapping

| CVL Edge function | Caller/authorization | Current effect | Unified Platform mapping | Evidence |
|---|---|---|---|---|
| `create-user` | admin or administratif bearer session | creates auth user and profile; rolls back auth user if profile insert fails | Workforce provisioning service/gateway; preserve role guard and rollback outcome | `auth-flow.md` §3 |
| `delete-user` | admin only bearer session | prevents self-delete and zone-chef deletion, then removes auth user/cascades data | Workforce retirement service/gateway; preserve lifecycle guard outcome | `auth-flow.md` §4 |

`seed-test-users` is not part of the active UI contract and is excluded from the target runtime mapping. Service-role implementation mechanics are not a Unified Platform authorization model.
