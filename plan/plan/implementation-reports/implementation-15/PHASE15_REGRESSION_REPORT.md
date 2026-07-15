# PHASE15 — Regression Report

## Intentional non-changes

| Area | Status |
|---|---|
| Business services / repositories | Untouched |
| JWT / RBAC | Untouched |
| REST/compat adapters | Untouched |
| Frontend | Untouched |
| Architecture | Untouched |

## Code touched (data path only)

| File | Change |
|---|---|
| `scripts/etl-production-import.js` | **NEW** ETL |
| `package.json` | add `seed:production-import` |
| `scripts/seed-local.js` | warn demo-only |

## Runtime regression signals

| Check | Result |
|---|---|
| `/health` after import | PASS |
| Auth for migrated admin | PASS |
| Table GETs via `/rest/v1` | PASS |
| Export stats | PASS |
| Demo seed dependency | Removed from DB (0 `@local.test`) |

## Residual risks

1. **Temporary passwords** — all migrated users share documented temp password until Auth hash import.  
2. **`jasmine.ad@gmail.com`** — not in merge artifact; cannot login.  
3. Shared Docker volume previously polluted by tests — wiped by ETL TRUNCATE (intentional).  
4. Re-running `seed:local` after production import **will contaminate** demo users again — documentation warns against this.

**Regression verdict:** PASS for API surface; data-layer reset was intentional.
