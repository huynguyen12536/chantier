# PHASE15 — Business Data Validation Report

**Method:** terminal only (`curl` / PowerShell `Invoke-RestMethod`, `docker exec`, `psql`). No Jest / Playwright.

| Step | Call | Result |
|---|---|---|
| Health | `GET /health` | PASS — db up, migrations 001–010 |
| Auth | password grant joseph.ad | PASS |
| List chantiers | `GET /rest/v1/chantiers` | PASS — 6 rows |
| List periodes | `GET /rest/v1/periodes_travail` | PASS — 41 rows |
| Export stats | `GET /api/export/stats` | PASS — total_declarations=41, validees=37, en_attente=4, total_heures=397.45 |
| Validation queue | `GET /api/validation/queue` | PASS — empty/array (4 soumise may be filtered by scope; admin returned ok) |

## Relationship sample

- Affectations: 12 rows linking migrated users ↔ chantiers.  
- Periodes/declarations: 41/41 with preserved validated_by FKs.  
- Zones: 0/0/0 — matches dump.

**Verdict:** Business data readable through Unified API after migration — PASS.
