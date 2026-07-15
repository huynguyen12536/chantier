# PHASE15_IMPLEMENTATION_REPORT.md

**Date:** 2026-07-15  
**Mode:** Production Hardening implementation  

## Fixes delivered

| ID | Change |
|---|---|
| DEF-P15-001 | FE healthcheck → `http://127.0.0.1:80` in phase13 compose + Harbor compose |
| DEF-P15-002 | Removed hosted Supabase URL/anon key from `eas.json`, compose, GitHub deploy workflow |
| DEF-P15-003 | Unified active deploy env to `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_ANON_KEY` |
| DEF-P15-004 | Moved Deno Edge sources → `archive/legacy-supabase-edge-functions/` + obsolete markers |
| DEF-P15-005 | `docker-compose.test.yml` + `.env.test` + `npm test` uses port **5433** / DB `chantier_test` |
| DEF-P15-006 | `api-chantier/DEPLOYMENT.md` |
| DEF-P15-007 | `api-chantier/PRODUCTION_CHECKLIST.md` |
| DEF-P15-008 | Regression: **117/117 PASS**; Docker db/api/web **healthy** |

## Additional verified defect (migrate fresh DB)

Migration `007` exception handler now also catches PG16 `duplicate_table` (42P07) so fresh test DBs migrate cleanly. No business logic change.

## Non-goals respected

No Imp-02…12 business rewrites · no ETL · no API redesign · no new product features.
