# Decision Request — DR-IMP06-002 — RESOLVED

**Status:** ✅ RESOLVED  
**Resolved by:** Product Decision  
**Date:** 2026-07-14  
**Winner:** **CADRE**

## Decision

Hours calculation follows chantier cadre configuration (`heure_*`).

- If cadre configuration exists and is valid → use cadre split (normales / supplémentaires).
- If no valid chantier configuration → fallback **7h**.
- Never hardcode 7h when chantier configuration is available.

Supersedes Conflict Matrix **C-03** dump fixed-7h-only view for Unified Platform.
