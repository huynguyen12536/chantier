# IMP05_PARITY_PATCH_REPORT

| Field | Value |
|---|---|
| Module | Imp-05 Assignments & Zones — **Parity Patch** |
| Status | **PASS** |
| Date | 2026-07-14 |
| Scope | Affectations + Zones only (no Timesheet / FE / Auth / Chantiers business changes) |

## Objective
Align Backend Imp-05 with **Current Verified Legacy** in `migration-analysis/` (RLS, schema dump, Flow C). Not a new feature.

## Kept (already correct)
- UNIQUE(user_id, chantier_id)
- Soft remove `date_fin`
- UPSERT affectation
- FK assignment
- Zone chef FK **RESTRICT** (repo decision kept)
- Entity relationships

## Fixed vs CVL
| Gap | CVL evidence | Fix |
|---|---|---|
| Affectation write roles | dump: admin\|administratif\|**chef_equipe** | Allow chef write |
| Zone RBAC | administratif **no** `is_admin` zone policies | Remove administratif from zone writes |
| Ownership | `chef_equipe_id = auth.uid()` / `is_zone_owner` | Assert on all zone mutations |
| Scoped lists | SELECT policies | Scope by role |
| Schema | CHECK dates, indexes chef/dates, `description` | Migration `006_imp05_parity.sql` |
| UNIQUE zones_ouvriers | **Absent** in dump | Dropped |
| Flow C unlink/soft/delete | DELETE chantier link; UPDATE/DELETE ouvriers; DELETE zone | API completed |

## Tests
`npm test` → **31/31 PASS** (Imp-05 parity + Imp-01…08 regression)

## Commit SHA
`266efc4f8c540d314b0578be7efe356ea11a2016`

## FE / Imp-06
- FE Contract: unchanged (Frozen)
- Timesheet Imp-06: unchanged (regression green)
