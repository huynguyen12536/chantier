# SCHEMA_PARITY_REPORT — Imp-05 (rewritten after rework)

| Item | Action | Notes |
|---|---|---|
| `valid_affectation_date_range` | **ADD** CHECK | dump evidence |
| `idx_affectations_chef` / `idx_affectations_dates` | **ADD** INDEX | dump evidence |
| `zones_equipe.description` | **ADD** COLUMN | dump + repo create |
| UNIQUE(zone_id, user_id) on `zones_ouvriers` | **KEEP / RESTORE** | From Unified `004`; dump lacked it — **do not DROP** (Consolidation UNION rule) |
| Zone chef FK RESTRICT | KEEP | Prior PASS |

No DROP / destructive ALTER in final migration set.
