# Decision Request — DR-IMP06-003 — RESOLVED

**Status:** ✅ RESOLVED  
**Resolved by:** Product Decision  
**Date:** 2026-07-14  
**Winner:** **P+Fsplit**

## Decision

1. **Preserve** CVL sync quirk for `nb_deplacements`: DeclarationSync does **not** overwrite `nb_deplacements` on upsert (FE compatibility / C-08 preserved).
2. **Fix** auto-approval audit: when AutoApproval sets `validee`, must set complete audit trail including **`validated_by`** and **`validated_at`**.

Supersedes open C-08/C-09 as: C-08 preserve omit-on-sync; C-09 fixed for Unified Platform.
