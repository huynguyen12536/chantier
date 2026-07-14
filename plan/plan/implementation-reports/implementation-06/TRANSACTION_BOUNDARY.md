# TRANSACTION_BOUNDARY — Imp-06

All period write paths use `withTransaction` (`pool.js`).

| Use case | Boundaries (single TX) |
|---|---|
| Create period | INSERT period → DeclarationSync → optional AutoApproval (+ PeriodPropagation) |
| Update period | UPDATE period → DeclarationSync → optional AutoApproval |
| Delete period | DELETE period → DeclarationSync (Soft Annulee if empty) |
| Decide declaration | UPDATE declaration decision → PeriodPropagation |

## Guarantees
- Partial failure rolls back period + declaration + period propagation together.  
- No SQL triggers — orchestration only in application services.  
- Repository methods accept explicit `client` for TX participation.
