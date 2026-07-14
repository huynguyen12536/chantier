# Decision Request — DR-IMP06-003

**Status:** ⏳ Waiting Human  
**Module:** Wave 2 Imp-06 Timesheet  
**Blocks:** Field write parity + auto-approve audit  
**Related:** C-08, C-09; SUMMARY §4

## Context

1. **C-08:** Column/view `nb_deplacements` exists; sync UPSERT **does not write** it → possible drift.  
2. **C-09:** Auto-approve sets `validee` + `validated_at` but **not** `validated_by`.

## Options

| ID | Choice |
|---|---|
| **P** | Preserve CVL quirks (omit nb_deplacements on sync; auto-approve without validated_by) |
| **F** | Fix: write nb_deplacements; set `validated_by` to system sentinel / null policy documented |
| **P+Fsplit** | Preserve nb_deplacements omit; fix validated_by only (or reverse) |

## Recommendation

**P** for strict Legacy parity until Product wants audit hardening — then **F** for validated_by at minimum.

## Requested

Reply **P / F / P+Fsplit**.
