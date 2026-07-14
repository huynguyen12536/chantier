# Confidence Matrix — Chantier Investigation

**Date:** 2026-07-14  
**Flow state:** Phase 2 — Technical Investigation Complete · Waiting External Confirmation  
**Companion:** `SOURCE_OF_TRUTH_DECISION.md`, `plan/plan/NEXT_ACTION_MATRIX.md`

Confidence = evidence strength **only** (not wishful parity).

---

| ID | Statement | Evidence | Confidence (%) | Blocking Dependencies | Next Verification Step |
|---|---|---|---|---|---|
| C01 | Committed FE/EAS runtime URL is `afgveikzneaablcuzwdb` | `app.config.js`, `eas.json` preview+production, `.env.example`; no workspace `.env` override | **95** | None for statement itself | Optional: read deployed VM/CI secret to see if override exists |
| C02 | Single FE Supabase client (no dual-client Super Admin) | One `createClient` in `services/supabase.ts`; Architecture Scope Validation | **95** | None | None required for this claim |
| C03 | Implemented product is Company BTP timesheet (not Super Admin portal) | Roles in `types/index.ts`; no `companies`; Flow H “CHƯA CÓ CODE”; single CI repo `Chantier-web-app` | **90** | None | None |
| C04 | Schema dump obtained from `hzppsttpzzeuslnpcdkv` | CLI `.temp` link; successful `pg_dump` / inventory under `production-dump/` | **95** | None | None |
| C05 | Dump DB (`hzppst`) == Runtime DB (`afgveikz` or CI) | **No positive equality evidence**; different refs observed; afgveikz dump failed | **10** | Human/CI confirmation of live URL | Execute Scenario A/B/C in `NEXT_ACTION_MATRIX.md` |
| C06 | `hzppst` is Production | No env label; only CLI name CHANTIER + dumpable | **15** | C05 | Human classifies env after confirming runtime ref |
| C07 | `afgveikz` is Production | EAS profile named `production` uses afgveikz in **repo**; VM may override via secrets | **40** | CI secret value; afgveikz dump | Reveal `secrets.EXPO_PUBLIC_SUPABASE_URL` or dump afgveikz |
| C08 | Deploy VM (`chantier.vm.dfm-europe.com`) uses afgveikz | README host only; `deploy.yml` injects secrets (opaque) | **20** | Access to secrets or live env | Inspect CI secret / server env |
| C09 | App triggers (3) exist on hzppst | Inventory + `01_public_schema.sql` | **95** | C05 if claiming “production triggers” | Re-verify on confirmed runtime DB |
| C10 | No `on_auth_user_created` / auth.users profile hook on hzppst | `information_schema.triggers` empty for auth.users | **95** | C05 for production claim | Re-check on confirmed runtime DB |
| C11 | hzppst sync_declarations uses hard DELETE (not soft-cancel) | `04_function_bodies.sql` | **90** | C05 for production claim | Compare body on confirmed runtime DB |
| C12 | hzppst view uses fixed 7h (not cadre functions) | `05_extra_inventory.txt` view def; missing cadre fns | **90** | C05 | Compare on confirmed runtime DB |
| C13 | Repo has functions not on hzppst (`minutes_from_time`, cadre, week RPC) | Inventory missing-funcs query + migrations present | **95** | C05 whether “missing on production” | Check confirmed runtime DB |
| C14 | Documentation SoT from 65 migrations is accurate for **live production** | Known drift vs hzppst; afgveikz unknown | **35** | C05 | Dump confirmed runtime → refresh SoT |
| C15 | Backend may be designed for production parity now | Blocked by C05/C06/C07/C08 | **5** | External confirmation + Phase 2 Gate close | Follow `NEXT_ACTION_MATRIX`; then Phase 3 |

---

## Summary bands

| Band | IDs | Meaning |
|---|---|---|
| High (≥90) | C01–C04, C09–C13 | Safe claims for agent-completed investigation |
| Medium (40–60) | C07 | Suggestive but not proven |
| Low (≤35) | C05–C06, C08, C14–C15 | Must not drive Production SoT or Backend design |

---

## Rule

Do **not** raise confidence on C05–C08/C14–C15 without new evidence.  
Do **not** start Phase 3 while C15 remains blocked (unless Scenario D exception in Decision Log).
