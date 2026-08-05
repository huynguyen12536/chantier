# 07 — Default Value Audit

| Field | Rows | Default applied | Evidence |
|-------|------|-----------------|----------|
| profiles.actif | 9 | true | Source/merged profile has no actif; local TRUE (COALESCE default) |

## Notes

- `profiles.actif` DEFAULTED TRUE when absent from merged (observed: 9/9 business profiles).
- ETL *can* invent `affectations_chantiers.date_debut` via COALESCE(..., CURRENT_DATE) when NULL — **not observed** in this dataset (all 12 affectations already had dates).
- Boolean column defaults exist in DDL; source-provided flags matched without invention.