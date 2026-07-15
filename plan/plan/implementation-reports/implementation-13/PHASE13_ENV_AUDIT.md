# PHASE13_ENV_AUDIT.md

**Date:** 2026-07-15  
**Evidence-only**

---

## 1. All environment variables found in FE tree

| Variable | Defined / read | Current role |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.example`; `services/supabase.ts`; hardcoded in `app.config.js` `extra` | Supabase project HTTP origin |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same | Anon JWT for client + `apikey` header on Edge fetch |
| `EXPO_FORCE_WEBCONTAINER_ENV` | `.env.example`; forced `=1` in `app.config.js` | Bolt/WebContainer Expo tunnel behavior |
| `VITE_SUPABASE_URL` | `scripts/create-test-users.ts` | Script-only Edge URL |
| `VITE_SUPABASE_ANON_KEY` | same | Script-only anon |

Deno Edge (not Expo app) uses `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` inside `supabase/functions/*` — hosted Edge runtime.

---

## 2. Categorization (cutover inventory)

| Variable | Category | Evidence reason |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | **Replace** | Must stop pointing at `https://afgveikzneaablcuzwdb.supabase.co` for local Unified |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Replace** or **Remove** (if client discarded) | Still required as long as supabase-js / `apikey` header used |
| `EXPO_FORCE_WEBCONTAINER_ENV` | **Keep** | Unrelated to backend host; DX for Bolt |
| `VITE_SUPABASE_*` | **Replace** or **Remove** | Dev script only |
| Deno `SUPABASE_*` Edge secrets | **Remove** from local product path | Edge replaced by Imp-12 on Unified API |

Hardcode in `app.config.js` currently **overrides** empty env — evidenced constants at lines 9–11.

---

## 3. Not present

No FE env for Redis, S3, MinIO, mail, Imp-09 SSE URL, or separate API URL distinct from Supabase URL.
