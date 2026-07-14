# Conflict Register

| ID | Status | Owner/decision authority | Blocking effect | Related artifact |
|---|---|---|---|---|
| C-01 | Open | External environment confirmation | data source/cutover design | `CONFLICT_MATRIX.md` |
| C-02 | Open | Architecture/data owner | migration baseline selection | `CONFLICT_MATRIX.md` |
| C-03 | Open | Product owner | normal/overtime calculation parity | `CONFLICT_MATRIX.md` |
| C-04 | Open | Product owner | cancellation/declaration lifecycle parity | `CONFLICT_MATRIX.md` |
| C-05 | Open | Product + security | user/zone deletion behavior | `CONFLICT_MATRIX.md` |
| C-06 | Open | Runtime/platform owner | frozen FE realtime compatibility | `realtime_mapping.md` |
| C-07 | Deferred | Product/architecture | tenancy and Super Admin are not Phase 3 implementation scope | `FUTURE_EXTENSION_POINTS.md` |
| C-08 | Open | Product/data owner | displacement count data correctness | `LEGACY_SPECIFIC_RULES.md` |
| C-09 | Open | Product/audit owner | auto-approval attribution | `LEGACY_SPECIFIC_RULES.md` |
| C-10 | Open | Security/product owner | invalid zone-worker permission must not be copied blindly | `LEGACY_SPECIFIC_RULES.md` |

None of these conflicts invalidate O3 or the documentation pack. They prevent Phase 4 from selecting final behavior without explicit confirmation.
