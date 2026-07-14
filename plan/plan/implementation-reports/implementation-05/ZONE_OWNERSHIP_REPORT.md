# ZONE_OWNERSHIP_REPORT — Imp-05

## Rule (CVL)
`zones_equipe.chef_equipe_id = actor.id` for chef mutations (`is_zone_owner`).

Admin bypasses ownership. Administratif cannot write.

## Applied to
| Action | Guard |
|---|---|
| create | chef must set `chef_equipe_id = self` |
| update / delete | `assertCanManageZone` |
| link / unlink chantier | same |
| add / soft-remove / unlink ouvrier | same |

## Code
`api-chantier/src/modules/zones/service.js` → `assertCanManageZone`

## Tests
Ownership forge (other chef) → 403 `FORBIDDEN_OWNERSHIP`.
