# Decision Request — DR-IMP06-001 — RESOLVED

**Status:** ✅ RESOLVED  
**Resolved by:** Product Decision  
**Date:** 2026-07-14  
**Winner:** Soft Annulee (**S**)

## Decision

When the last active period disappears for key `(user_id, chantier_id, date)`:

- Declaration **MUST NOT** be physically deleted.
- Set `statut = annulee`.
- Keep full audit history (`validated_by` / `validated_at` per cancel / sync policy).
- **No hard delete**.

Supersedes Conflict Matrix **C-04** dump hard-DELETE behavior for Unified Platform.
