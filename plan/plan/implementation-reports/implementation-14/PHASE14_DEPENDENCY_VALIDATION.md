# PHASE14_DEPENDENCY_VALIDATION.md

**Date:** 2026-07-15  
**Tools:** `grep` / `Select-String` / `npm ls` / `docker exec … grep`

## Active FE runtime dependency

```text
npm ls @supabase/supabase-js
# (empty) — not installed
```

`package.json` does **not** list `@supabase/supabase-js` (removed in Phase 13).

**PASS** for runtime package dependency.

## Active app config

`app.config.js` / `.env.example` use `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_ANON_KEY` (local), not Supabase cloud URL.

## Built FE bundle (chantier-web)

```text
grep afgveikzneaablcuzwdb → 0 matches in web JS assets
grep localhost:3001 → present (baked API origin)
```

**PASS** for served SPA bundle (no hosted Supabase project ref).

## Residual cloud references (not active runtime path)

| Location | Finding | Severity |
|---|---|---|
| `eas.json` | Still hardcodes `https://afgveikzneaablcuzwdb.supabase.co` + anon JWT for EAS profiles | **MAJOR** leftover |
| `chantier1/.../docker-compose.yml` (Harbor file) | Env vars still named `EXPO_PUBLIC_SUPABASE_*` | **MINOR** legacy naming |
| `supabase/functions/**` Deno stubs | Still `import … npm:@supabase/supabase-js@2.58.0` | **MINOR** dead cloud Edge source (not used by local Unified Edge compat) |
| `services/supabase.ts` filename | Unified client; comment only mentions supabase-js | **COSMETIC** |

## API workspace

No `supabase.co` / anon cloud key matches under `api-chantier` production tree.

## Verdict

**PASS** for **running local product path**.  
**FAIL** for “repo contains zero cloud Supabase strings anywhere” — leftovers in `eas.json` + stale Edge folders.
