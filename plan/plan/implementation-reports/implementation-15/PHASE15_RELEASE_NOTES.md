# PHASE15_RELEASE_NOTES.md

**Phase 15 — Production Hardening**  
**Date:** 2026-07-15  

## Highlights

- Frontend container healthcheck fixed (`127.0.0.1`) — Docker status now **healthy**.  
- Removed hosted Supabase configuration from active deploy surfaces (`eas.json`, compose, CI).  
- Unified on `EXPO_PUBLIC_API_URL`.  
- Archived obsolete Deno Edge Function sources.  
- Isolated automated-test Postgres (port 5433) so tests no longer pollute the demo volume.  
- Added `DEPLOYMENT.md` and `PRODUCTION_CHECKLIST.md`.  
- Migration 007 hardened for PG16 duplicate unique index on fresh DBs.

## Operator actions after pull

1. `npm run docker:up` (or compose phase13 up --build)  
2. Ensure CI secrets use `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_ANON_KEY`  
3. For tests: `npm run docker:test:up && npm run migrate:test && npm test`
