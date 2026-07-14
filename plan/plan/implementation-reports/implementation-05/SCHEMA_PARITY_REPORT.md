# SCHEMA_PARITY_REPORT — Imp-05 (post governance)

| Item | Action | Notes |
|---|---|---|
| `valid_affectation_date_range` | **ADD** CHECK | dump evidence (additive) |
| `idx_affectations_chef` / `idx_affectations_dates` | **ADD** INDEX | dump evidence (additive) |
| `zones_equipe.description` | **ADD** COLUMN | dump + repo (additive) |
| UNIQUE(zone_id, user_id) on `zones_ouvriers` | **KEEP / RESTORE** | Present in Unified `004`. Dump/repo create may omit it — **absence is not evidence** to DROP (DATABASE_EVOLUTION_POLICY Rule 2) |
| Zone chef FK RESTRICT | KEEP | Prior PASS |

Final migration set: **non-destructive only** (`006` additive; `007` restores UNIQUE if prior DROP ran).
