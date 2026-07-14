# Permissions Mapping — RLS to RBAC

This maps observed CVL outcomes to an RBAC/scoped-authorization candidate. It must retain all valid CVL outcomes before any deliberate product change.

| Role | Workforce | Worksites/assignments | Zones | Time periods/declarations | Export | Evidence |
|---|---|---|---|---|---|---|
| `ouvrier` | own profile | own assignments; sites via assignment ∪ zone | own memberships/read scope | own capture; constrained edit/delete; resubmit rejected | no evidenced general export | `rls-analysis.md` §62–95; SUMMARY rules 12,15 |
| `chef_equipe` | scoped team reads | supervised/zone scope | own zones and links | review/validate scoped team; dashboard scope | can export | RLS §62–117; Flow E/F |
| `administratif` | create user; broad management reads | create/update worksite and assignment | often not zone-admin | broad review/export per CVL policies | yes | Flow A/B/F; RLS |
| `admin` | full lifecycle incl delete | full management; delete via controlled cascade | full CRUD | full review/management | yes | SUMMARY rules 2,13; RLS |

## Translation rules

- Actor identity and role are evaluated centrally.
- Resource scope is assignment, supervised-worksite, and zone membership; it must not collapse to simple role-only access.
- Database constraints remain integrity controls. The known dump policy defect for zone-worker insert is recorded in `LEGACY_SPECIFIC_RULES.md`, not adopted as a valid permission.
- Future tenant filtering is deferred and must not be inferred from CVL.
