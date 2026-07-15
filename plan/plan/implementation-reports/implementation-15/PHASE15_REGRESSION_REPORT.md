# PHASE15_REGRESSION_REPORT.md

**Date:** 2026-07-15  

## npm test

```
npm run docker:test:up
npm run migrate:test
npm test
```

Result: **117 / 117 PASS** (23 suites), duration ~13s  
Environment: `.env.test` → `127.0.0.1:5433/chantier_test`

## Docker runtime

| Check | Result |
|---|---|
| FE HTTP | 200 |
| API `/health` | 200 |
| web health | healthy |
| api health | healthy |
| db health | healthy |
| Demo DB not wiped by tests | profiles stayed 974 |

## Config hygiene grep

Active FE tree (`*.yml/json/js/env*`): **no** `EXPO_PUBLIC_SUPABASE_*` / `*.supabase.co` matches.
