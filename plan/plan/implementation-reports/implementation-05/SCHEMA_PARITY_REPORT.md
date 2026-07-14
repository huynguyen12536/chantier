# SCHEMA_PARITY_REPORT — Imp-05

| Item | CVL | Before | After |
|---|---|---|---|
| `valid_affectation_date_range` | dump CHECK | missing | `006_imp05_parity.sql` |
| `idx_affectations_chef` | dump | missing | added |
| `idx_affectations_dates` | dump | missing | added |
| `zones_equipe.description` | dump / create migration | missing | added |
| UNIQUE(zone_id,user_id) on `zones_ouvriers` | **not in dump** | present (invented) | **dropped** |
| Zone chef FK RESTRICT | repo vs prod CASCADE (C-05) | RESTRICT | **kept** (prior PASS) |

No invented CHECKs on `zones_ouvriers` dates (not in dump).
