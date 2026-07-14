# IMP08_IMPLEMENTATION_REPORT — Reporting & Export

| Field | Value |
|---|---|
| Module | Imp-08 Reporting & Export |
| Status | **PASS** |
| Date | 2026-07-14 |
| Upstream | Imp-05/06/07 completed — **not modified** |
| Migrations | **None** (read-only; no schema change) |
| Tests | **48/48 PASS** |

## SoT mapping

| Requirement | Implementation |
|---|---|
| Flow F validated periods in range | `GET /api/export/payroll?from&to` WHERE `statut=validee` |
| SUMMARY #14 / SHARED #14 | Payroll excludes non-validee |
| canExport roles | admin, administratif, chef_equipe |
| Chef scope | `getChefChantierIds` |
| FE `panier_repas` | DTO adapter (storage `panier` unchanged) |
| FE `loadStats` + `total_heures` | `GET /api/export/stats` + CADRE via Imp-06 `splitHours` (import only) |
| FE user-payroll declarations | `GET /api/export/declarations?user_id&from&to` |
| CSV/format | Remains FE (frozen) |

## Architecture self-review

- Business logic in Application Service only; SQL is filtered SELECT.
- No writes / no review / no timesheet mutation.
- No Imp-05/06/07 source edits.
- No destructive migration.

## Accepted notes

- Dual field `panier` + `panier_repas` on payroll rows for adapter/test compatibility.
- Cadre for `total_heures` uses Imp-04 matin/après-midi columns (DR-002), not FE `heure_debut`/`heure_fin` on chantiers.
- Export generation is not persisted to an audit table (read-only Flow F; failures via HTTP envelope).

## SHA

Recorded after push.
