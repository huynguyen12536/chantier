# IMP08_ARCHITECTURE_REPORT

**Context:** Payroll Export BC (Unified Domain) — Flow F.

## Boundaries

| Concern | Owner |
|---|---|
| Validated period read | Imp-08 Export service |
| Declaration detail read (user payroll) | Imp-08 Export service |
| Cadre hour math | Imp-06 `splitHours` (imported; Imp-06 frozen) |
| Chef chantier scope | Shared `chefScope` (Imp-05/06) |
| CSV/XLSX formatting | Frontend (frozen) |

## Layering

```
Controller → Service (authz + query + DTO) → PostgreSQL persistence
```

No repository write path. No SQL business triggers.

## AuthZ

| Role | Payroll / Stats / Declarations |
|---|---|
| ouvrier | 403 |
| chef_equipe | supervised chantiers only |
| administratif / admin | all |

## Transaction

Read-only queries. No multi-write TX required.
