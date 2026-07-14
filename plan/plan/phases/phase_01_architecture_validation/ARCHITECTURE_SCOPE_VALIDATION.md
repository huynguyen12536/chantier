# Architecture Scope Validation

**Date:** 2026-07-14  
**Phase:** 1 (extension — gate before Phase 2)  
**Status:** **Architecture Scope Confirmed**  
**Dump DB:** not performed (forbidden in this gate)

> Evidence-only. No assumptions about org repos outside materials searched.

---

## Verdict

| Question | Answer | Confidence |
|---|---|---|
| Repository reflects **entire existing implemented** Chantier system to migrate? | **Yes** — single Company BTP timesheet app + its Supabase artifacts | High (within workspace + documented remotes) |
| Is this Super Admin Portal? | **No** | High |
| Is this Company Portal (single-tenant)? | **Yes** (app name “Chantier”; roles company-side) | High |
| Is this both portals? | **No** | High |
| Is there evidence of **another application repository** required for migrate? | **No** — only `DFM-EUROPE/Chantier-web-app.git` appears | High for docs-in-hand |
| Super Admin (brief Flow H)? | **Not implemented** anywhere in materials — greenfield, not a missing linked repo | High |

**Gate result:** Architecture Scope Confirmed → Phase 1 may close.  
**Still do not auto-start Phase 2** until human explicitly approves Phase 1 / dump target.

---

## 1. Inventory — all occurrences of project refs

### 1.1 `afgveikzneaablcuzwdb`

| Location | Kind | Role |
|---|---|---|
| `chantier1/.../app.config.js` | source / config | Hardcoded runtime URL + anon for Bolt/Expo extra |
| `chantier1/.../eas.json` | EAS build env | preview + production → same URL |
| `chantier1/.../.env.example` | docs/template | Same URL, placeholder key |
| `chantier1/.../env` (block 1) | informal local notes | URL + JWT claim `service_role` under ANON name |
| `plan/plan/**`, `migration-analysis/**` | governance / SoT | Citations of Phase 1 findings |

**Not found in:** CI workflow body (uses secrets), `api-chantier/`, comments as second client, archived portals.

### 1.2 `hzppsttpzzeuslnpcdkv`

| Location | Kind | Role |
|---|---|---|
| `supabase/.temp/linked-project.json` | CLI temp | Linked project name **CHANTIER** |
| `supabase/.temp/project-ref` | CLI temp | Same ref |
| `supabase/.temp/pooler-url` | CLI temp | Pooler host for same ref |
| `chantier1/.../env` (block 2) | informal local notes | Alternate URL + JWT claim `service_role` |
| `c:\Users\Gigabyte\Downloads\DFM\env 1` | **outside** workspace repo copy | Only hzppst — local operator note |
| SoT / plan docs | documentation | Explained as CLI / alternate env |

**Not found in:** `app.config.js`, `eas.json`, `.env.example`, `createClient` call sites, CI hardcoded URL.

### 1.3 CI/CD (no hardcoded ref)

| File | Finding |
|---|---|
| `.github/workflows/deploy.yml` | Build-args / compose env from `secrets.EXPO_PUBLIC_SUPABASE_URL` + `_ANON_KEY` — **project ref not visible in repo** |
| `Dockerfile` | Injects `ARG`/`ENV` EXPO_PUBLIC_* at build time |
| `docker-compose.yml` | Passes env at runtime container (static web build already baked at image build) |
| `README.md` | Deploy to `https://chantier.vm.dfm-europe.com/` — one product URL |

---

## 2. Classification of projects

| Project | Classification | Evidence |
|---|---|---|
| **`afgveikzneaablcuzwdb`** | **Committed / default app runtime** (dev+EAS files in source) | `app.config.js`, `eas.json` |
| **`hzppsttpzzeuslnpcdkv`** | **Local / CLI-linked environment** (Supabase CLI `.temp` + informal `env` / `DFM\env 1`) | `.temp/*`, `env` block 2 |
| **Either as “historical Super Admin DB”** | **Not supported** | No Super Admin app; both names point at Chantier BTP naming (`CHANTIER`, same FE) |
| **Deployed VM production** | **Unresolved in source** (secret-injected) | `deploy.yml` secrets only — **must be confirmed by human before Phase 2 dump**; may equal afgveikz or hzppst or a third ref |

| Classification labels requested | Mapping |
|---|---|
| Runtime (in committed source / EAS) | `afgveikz…` |
| Historical Super Admin | **None found** |
| Local-only / CLI | `hzppst…` (+ informal notes) |
| Unused in FE code path | `hzppst…` is unused by `createClient` / EAS defaults |

---

## 3. Portal type — evidence

### Company Portal (single-tenant BTP timesheet) — YES

| Evidence | Path |
|---|---|
| App display name `Chantier` | `app.json` |
| Roles only: `ouvrier \| chef_equipe \| administratif \| admin` | `types/index.ts` |
| Domain: chantiers, affectations, periodes, declarations, zones | FE screens + migrations |
| Deploy host `chantier.vm.dfm-europe.com` | `README.md` |
| Setup docs: “Database BTP”, test users company roles | `scripts/setup-database.md` |

### Super Admin Portal — NO

| Evidence against | Path |
|---|---|
| No `companies` / `company_id` / Super Admin screens | workspace grep (FE app sources) |
| Flow H documented **CHƯA CÓ CODE** | `migration-analysis/business-flows.md` |
| Brief vs reality table | `00-IMPORTANT-FINDINGS.md` |
| `is_super_admin` only in Auth seed INSERT columns | migrations seed files |

### Both — NO

One Expo app, one singleton Supabase client, one CI repo URL.

---

## 4. Other repository references

| Source | Remote / path mentioned | Implication |
|---|---|---|
| `deploy.yml` | `github.com/DFM-EUROPE/Chantier-web-app.git` | **Only** application git remote in deploy docs |
| Deploy server path | `/home/dfm/chantier/Chantier-web-app` | Single app directory |
| Workspace `chantier/` | `chantier1/` (FE), `api-chantier/` (new BE scaffold), `migration-analysis/`, `plan/` | No second legacy portal package |
| Parent `Downloads/DFM/` | Other projects (`Hawk`, `ekidom`, …) | **Unrelated product folders**; Hawk grep found **no** afgveikz/hzppst/Chantier-web refs |
| README / scripts / API docs | No second portal repo URL | No “clone Super Admin” instructions |

**Conclusion:** Materials do **not** show a required sibling Super Admin repository. `api-chantier/` is the **target** backend scaffold for this same product, not a second legacy system.

---

## 5. Incomplete vs Confirmed decision

| Criterion | Result |
|---|---|
| Missing second portal in docs/CI? | No evidence of missing sibling repo |
| Missing Super Admin **code**? | Yes — because **unimplemented** (Flow H), not because another repo is referenced and absent |
| Master Plan migrate scope | Single-tenant Chantier timesheet → Express/Postgres |

→ **Not** “Architecture Scope Incomplete”.  
→ **Architecture Scope Confirmed** for the **existing** system under Master Plan.

### Explicit non-claims (honesty)

1. **Cannot** assert from repo alone which Supabase project powers `chantier.vm.dfm-europe.com` (CI secrets).  
2. **Cannot** inventory private GitHub orgs beyond URLs in this codebase.  
3. If stakeholder later requires Flow H Super Admin as migrate scope, that is a **scope expansion** (greenfield), not a missed existing portal in this validation.

---

## 6. Follow-ups (not Phase 2 yet)

- Human: confirm Phase 1 close.  
- Before Phase 2 dump: confirm **which** project ref is production (`secrets.EXPO_PUBLIC_SUPABASE_URL` value).  
- Do not treat hzppst as Super Admin DB.

---

## SoT / Decision Log

- Decision Log row: Architecture Scope Confirmed (2026-07-14).  
- Phase 1 status → Done after this gate (await human ack to start Phase 2).
