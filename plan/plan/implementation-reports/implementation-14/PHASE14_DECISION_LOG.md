# PHASE14_DECISION_LOG.md

**Date:** 2026-07-15  
**Mode:** Validation only  

## Scope decisions (Phase 14)

| ID | Decision | Status |
|---|---|---|
| DR-P14-001 | Validation via terminal tools only (curl/docker/psql/grep/npm) — no Jest/Playwright/custom harness | LOCKED |
| DR-P14-002 | Old DB reference source = `migration-analysis/data-dumps/merged.json` (merged Supabase dumps) | LOCKED |
| DR-P14-003 | Local runtime target = Docker `chantier-db` + `chantier-api` + `chantier-web` | LOCKED |
| DR-P14-004 | Defects classified only — **no repair** in Phase 14 | LOCKED |
| DR-P14-005 | Expected that local DB ≠ merged cloud dump (Phase 13 seed/tests, no ETL import) | LOCKED |

## Human gates for next phase

1. Accept / prioritize defects in `PHASE14_DEFECT_REPORT.md`.  
2. Decide whether a data-load phase is required before production parity claims.  
3. Authorize any defect-fix coding **separately** (not Phase 14).
