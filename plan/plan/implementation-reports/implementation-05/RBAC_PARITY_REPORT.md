# RBAC_PARITY_REPORT — Imp-05

## Affectations (`rls-analysis` §62–66 + dump policies)

| Role | SELECT | INSERT/UPDATE (soft) | Evidence |
|---|---|---|---|
| admin | all | yes | Admins can … affectations |
| administratif | all | yes | same (role ANY admin\|administratif\|chef for write; SELECT admin\|administratif) |
| chef_equipe | `chef_equipe_id = self` | **yes** (was missing) | INSERT/UPDATE include chef_equipe |
| ouvrier | own `user_id` | no | Users can view own |

## Zones (`rls-analysis` §99–117)

| Role | SELECT | Write CRUD / links | Evidence |
|---|---|---|---|
| admin | all | yes (`is_admin`) | Admin can … zones |
| chef_equipe | own zones | own only (`is_zone_owner`) | Chef can … own zones |
| ouvrier | assigned active | no | Ouvrier can view assigned zones |
| administratif | **empty** (no policy) | **forbidden** (removed) | “Administratif Không qua is_admin()” |

## Decision
Implemented exactly as dump/RLS state — no permission expansion.
