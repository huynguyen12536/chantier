# PHASE15 — Foreign Key Validation Report

**Method:** LEFT JOIN orphan counts via `psql` + ETL `fk_orphans`.

| Check | orphan_count |
|---|---:|
| affectations.user_id → profiles | 0 |
| affectations.chantier_id → chantiers | 0 |
| affectations.chef_equipe_id → profiles | 0 |
| periodes.user_id → profiles | 0 |
| periodes.chantier_id → chantiers | 0 |
| periodes.validated_by → profiles | 0 |
| declarations.user_id → profiles | 0 |
| declarations.chantier_id → chantiers | 0 |
| declarations.validated_by → profiles | 0 |

Constraint integrity observed on load (no insert failures for UNIQUE / CHECK).

**Verdict:** FK validation PASS. No orphan rows.
