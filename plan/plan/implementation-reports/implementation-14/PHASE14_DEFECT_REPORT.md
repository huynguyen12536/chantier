# PHASE14_DEFECT_REPORT.md

**Date:** 2026-07-15  
**Rule:** Classify + evidence only. **DO NOT FIX** in Phase 14.

---

## DEF-P14-001 — FE container Healthcheck false unhealthy

| Field | Value |
|---|---|
| Severity | **MINOR** |
| Evidence | `docker inspect chantier-web` → `Status=unhealthy`; log: `wget: can't connect to remote host: Connection refused` when probing `http://localhost:80`. Host `curl http://127.0.0.1:16035` → **200**. Inside container: `wget http://127.0.0.1/` works; `wget http://localhost/` fails (likely IPv6 `::1`). |
| Root cause | Healthcheck uses hostname `localhost` which resolves to IPv6 without nginx listener. |
| Recommended fix | Change healthcheck URL to `http://127.0.0.1/` (or disable IPv6 / listen on `::`). |
| Status | OPEN — not fixed |

---

## DEF-P14-002 — `eas.json` still embeds hosted Supabase URL + anon key

| Field | Value |
|---|---|
| Severity | **MAJOR** |
| Evidence | `eas.json` lines contain `EXPO_PUBLIC_SUPABASE_URL=https://afgveikzneaablcuzwdb.supabase.co` and a JWT anon key (preview/production profiles). |
| Root cause | EAS/cloud build config not cut over in Phase 13 scoped thaw (local Docker/app.config only). |
| Recommended fix | Point EAS env to Unified API URL; remove cloud anon JWT; rotate compromised anon key in Supabase if still live. |
| Status | OPEN — not fixed |

---

## DEF-P14-003 — Local DB does not contain old Supabase business rows

| Field | Value |
|---|---|
| Severity | **MAJOR** (for data-continuity gate) / **Expected** under Phase 13 (no ETL) |
| Evidence | merged dump profiles=9 vs local=974; `COUNT(*)` of three cloud PKs = **0**. |
| Root cause | Phase 13 authorized seed + cutover only; cancelled ETL. Test suite residue dominates volume. |
| Recommended fix | Authorized data-load / ETL phase OR explicit Human acceptance that local product is seed/demo data only. |
| Status | OPEN as product-parity risk; not a code regression |

---

## DEF-P14-004 — Legacy Harbor `docker-compose.yml` still names Supabase env vars

| Field | Value |
|---|---|
| Severity | **MINOR** |
| Evidence | `chantier1/.../docker-compose.yml` still passes `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`. Phase13 compose override builds with `EXPO_PUBLIC_API_URL`. |
| Root cause | Old deploy compose not updated. |
| Recommended fix | Align env names with `EXPO_PUBLIC_API_*` or remove file if unused. |
| Status | OPEN — not fixed |

---

## DEF-P14-005 — Dead Deno Edge stubs still depend on `@supabase/supabase-js`

| Field | Value |
|---|---|
| Severity | **MINOR** |
| Evidence | `supabase/functions/{create,delete,seed}-user/index.ts` import `npm:@supabase/supabase-js@2.58.0`. Not used by local Unified `/functions/v1` adapters. |
| Root cause | Frozen historical Edge Functions kept in tree. |
| Recommended fix | Archive/delete or clearly mark obsolete; ensure tsc excludes remain. |
| Status | OPEN — not fixed |

---

## DEF-P14-006 — Long-lived Docker volume polluted by test data

| Field | Value |
|---|---|
| Severity | **COSMETIC / MINOR** for local demo clarity |
| Evidence | Hundreds of profiles/chantiers/periods from prior `npm test` runs. |
| Root cause | Shared `chantier_pg_data` volume used by tests and demo. |
| Recommended fix | Separate test DB / `docker compose down -v` before release demos (destructive — Human authorize). |
| Status | OPEN — not fixed |

---

## Critical defects

**None** found that break the seeded local product path (login→CRUD→validate→export→SSE→logout).

---

## Summary counts

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| MAJOR | 2 (eas.json cloud leftovers; data continuity unproven) |
| MINOR | 3 |
| COSMETIC | 1 (overlap with volume pollution) |
