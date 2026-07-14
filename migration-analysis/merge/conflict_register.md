# Conflict Register

| ID | Status | Owner/decision authority | Blocking effect | Related artifact |
|---|---|---|---|---|
| C-01 | Open | External environment confirmation | data source/cutover design | `CONFLICT_MATRIX.md` |
| C-02 | Open | Architecture/data owner | migration baseline selection | `CONFLICT_MATRIX.md` |
| C-03 | **Resolved** | Product — DR-IMP06-002 CADRE | Unblocked Imp-06 calculation | `CONFLICT_MATRIX.md` |
| C-04 | **Resolved** | Product — DR-IMP06-001 Soft Annulee | Unblocked Imp-06 empty-day sync | `CONFLICT_MATRIX.md` |
| C-05 | Open | Product + security | user/zone deletion behavior | `CONFLICT_MATRIX.md` |
| C-06 | Open | Runtime/platform owner | frozen FE realtime compatibility | `realtime_mapping.md` |
| C-07 | Deferred | Product/architecture | tenancy and Super Admin are not Phase 3 implementation scope | `FUTURE_EXTENSION_POINTS.md` |
| C-08 | **Resolved** | Product — DR-IMP06-003 preserve omit | Sync must not write nb_deplacements | `LEGACY_SPECIFIC_RULES.md` |
| C-09 | **Resolved** | Product — DR-IMP06-003 fix audit | Auto-approve must set validated_by + validated_at | `LEGACY_SPECIFIC_RULES.md` |
| C-10 | Open | Security/product owner | invalid zone-worker permission must not be copied blindly | `LEGACY_SPECIFIC_RULES.md` |

None of these conflicts invalidate O3 or the documentation pack. They prevent Phase 4 from selecting final behavior without explicit confirmation.
