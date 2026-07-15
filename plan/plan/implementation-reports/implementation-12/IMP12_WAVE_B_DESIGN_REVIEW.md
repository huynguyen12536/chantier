# IMP12_WAVE_B_DESIGN_REVIEW.md

**Date:** 2026-07-15  
**Mode:** Phase 2 Design Review — **no production code**  
**Input:** Wave B investigation pack · Wave A CLOSED · SoT listed below  
**Code head (Wave A):** `a706e1111f`  

**Evidence / SoT:**

| Source | Use |
|---|---|
| `FE_COMPATIBILITY_ADAPTERS.md` | Eight tables · Edge · RPC · auth · events |
| `FLOW_CONTRACTS.md` | Flows A–G adapter expectations |
| `fe_contract_matrix.md` / `IMP12_FE_CONTRACT_MATRIX.md` | Observable FE contracts |
| `business-flows.md` | Flow semantics |
| `permissions_mapping.md` | RBAC stays in services |
| `02_SINGLE_WRITE_PATH.md` | Adapters invoke commands; no competing writes |
| ADR-001 | Compatibility at FE boundary; Identity ownership |
| Imp-09 / 10 / 11 FINAL | Transport / jobs / admin LOCKED |
| Imp-12 Wave A | Dual Edge/RPC; profiles `/tables`; DR-001…004 sealed |

**Rule:** Recommend only options that reuse Imp-02…11 exports. Do not invent business.

---

## 1. Remaining table adapters — class review

| Table | Class | Why |
|---|---|---|
| `chantiers` | **READY** | Imp-04 `list/create/update` exist; row DELETE already via Wave A RPC cascade; Flow B |
| `affectations_chantiers` | **READY** | Imp-05 `listAffectations`, `assignUser`, `softRemoveAffectation` exist |
| `zones_equipe` | **READY** | Imp-05 `/api/zones` CRUD exists |
| `zones_chantiers` | **READY** | Imp-05 link/unlink chantier APIs exist; compose ids in mapper |
| `zones_ouvriers` | **READY** | Imp-05 add/soft-remove ouvrier APIs exist |
| `periodes_travail` | **READY** | Imp-06 periods CRUD exists; adapter must call service only (sync stays in TX) |
| `declarations_heures` **GET** | **READY** | Imp-06 `listDeclarations` / get paths exist |
| `declarations_heures` **UPDATE statut** | **BLOCKED** until B-003 | FE patches `statut`; Unified uses Imp-07 commands — needs explicit map DR; Wave A DR-003=C |
| Dual `/rest/v1/{table}` | **BLOCKED** until B-002 | FE supabase-js default path; Wave A only dual’d Edge/RPC |
| Auth GoTrue/session | **BLOCKED** until B-004 | Wave A DR-004=B; Imp-02 owns JWT business |
| Supabase Realtime bridge | **OUT OF SCOPE** | Imp-09 SSE is SoT; Imp-09 FINAL; B-006 |
| Export table / Super Admin / inactive RPC | **OUT OF SCOPE** | Imp-08 / Decision Log / inactive contract |

---

# DR-IMP12-B-001 — Wave B product scope

**Question:** What ships in the first Wave B coding authorization?

### Options

| Option | Meaning |
|---|---|
| **A** | READY adapters only (7 tables; declarations **GET** only; no auth; no declarations UPDATE) |
| **B** | A + declarations UPDATE map (requires B-003=A) |
| **C** | No Wave B — remain Wave A only |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Unlocks Flows B/C/D table reads+works; lowest invent; matches Wave A “thin adapter” proof | Flow E FE statut patch still unsupported via table path |
| **B** | Closer to full frozen-FE review path | Higher regression on Imp-07; must seal B-003 carefully |
| **C** | Zero risk | Imp-12 cannot finish before Imp-13; FE freeze unmet for tables |

### Impact

| Dimension | A | B | C |
|---|---|---|---|
| Architecture | Additive `compat/tables/*` | + statut→Imp-07 mapper | None |
| Ownership | Imp-04/05/06 invoke only | + Imp-07 invoke only | — |
| Regression | Imp-04…06 suites | + Imp-07 suite critical | — |
| Compatibility | Tables allow-list | + review updates | Wave A only |

### Recommendation: **A**

Preferred first coding seal: ship READY table adapters without reopening declarations WRITE in the same batch. Declarations UPDATE stays a **gated follow-on** (B-003) so Imp-07 risk is isolated.

### Rejected

- **B** as *first* batch — couple table flood with Imp-07 mapping risk.  
- **C** — contradicts WAVE2 Imp-12 goal and FE_COMPATIBILITY eight-table allow-list after Wave A.

---

# DR-IMP12-B-002 — Dual mount `/tables` vs `/rest/v1`

**Question:** Where are table adapters mounted?

### Options

| Option | Meaning |
|---|---|
| **A** | Dual: `/tables/{t}` **and** `/rest/v1/{t}` → same handlers |
| **B** | `/tables` only |
| **C** | `/rest/v1` only |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Matches FE supabase-js `/rest/v1`; mirrors Wave A DR-001 dual for Edge/RPC; design SoT also names `/tables` | Two URLs same behavior (document) |
| **B** | Simpler | **Breaks FE freeze** unless FE base URL changed (forbidden) |
| **C** | Matches live FE path | Loses design `/tables` name; less symmetry with Wave A profiles `/tables` |

### Recommendation: **A**

FE freeze + Wave A dual-prefix precedent (`/functions`+`/v1`, `/rpc`+`/rest/v1/rpc`) make dual table mounts the only non-inventive compatibility choice.

### Rejected

- **B** — FE frozen; `/rest/v1` is observed client path.  
- **C** — drops Wave A `/tables/profiles` consistency and design SoT `/tables` naming.

---

# DR-IMP12-B-003 — Declarations UPDATE

**Question:** Does Wave B map FE `declarations_heures` UPDATE to Imp-07?

### Options

| Option | Meaning |
|---|---|
| **A** | Map UPDATE → Imp-07 `approve/reject/return/cancel` / `decideDeclaration` (statut→command) |
| **B** | Keep Wave A DR-003=C — no write adapter |
| **C** | Read-only declarations table adapter only (GET) |

### Single write path check

| Approach | Second write path? |
|---|---|
| Adapter → `reviewDecision.approve/reject/…` | **No** — Imp-07 remains sole transition owner |
| Adapter → raw `UPDATE declarations_heures SET statut` | **YES — FORBIDDEN** |
| Adapter → Imp-06 repo update | **YES — FORBIDDEN** |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Unlocks Flow E via frozen FE table updates | Mapping statut→command must be complete/evidence-based; reopen Wave A 003 |
| **B** | Preserves Wave A seal; zero Imp-07 touch | FE freeze conflict for review UI |
| **C** | Safe partial for Wave B with B-001=A | Writes still missing |

### Recommendation: **C** (aligned with B-001=A)

For the **first** Wave B coding authorization: declarations **GET only**. Do **not** implement statut PATCH until Human explicitly chooses **A** in a follow-on authorization (may be “Wave B2”).  
If Human instead seals **B-001=B**, then B-003 must be **A** and must forbid any SQL/repo statut write.

### Rejected

- **A** as silent default inside B-001=A — scope creep.  
- Raw table UPDATE without Imp-07 — ownership violation.  
- **B** as permanent if goal is full Imp-12 before Imp-13 — deferral must be explicit.

---

# DR-IMP12-B-004 — Auth compatibility (**REVISED**)

**Question:** Thin GoTrue/session adapter in Wave B?

### Options

| Option | Meaning |
|---|---|
| **A** | Imp-12 routes → Imp-02 `login` / `refresh` / `logout` / `getProfileById` envelope map only |
| **B** | Keep Wave A DR-004=B — no auth adapter in Imp-12 |
| **C** | Defer auth compatibility to Imp-13 |

### Mandatory answers (revision)

| # | Question | Answer |
|---|---|---|
| 1 | Can a thin Auth Compatibility Adapter exist **without** duplicating authentication logic? | **YES.** Same pattern as Wave A Edge → `usersService.createUser`: compat controller parses FE/GoTrue-shaped body → calls `auth/service.login|refresh|logout|getProfileById` → maps response envelope. Zero password hashing, JWT signing, refresh persistence, or RBAC rules in Imp-12. |
| 2 | Would it violate ownership? | **NO.** Identity & Access business stays Imp-02 (ADR-001). Imp-12 owns path/envelope translation only (Imp-12 mission). |
| 3 | Would it violate JWT ownership? | **NO.** Tokens remain issued/verified solely inside Imp-02 (`login` / `refresh` / middleware). Adapter never creates `jsonwebtoken` calls or alternate secrets. |
| 4 | Would it violate RBAC ownership? | **NO.** Role checks remain `requireAuth` / `requireRoles` and service guards. Adapter does not invent roles or scopes. |
| 5 | Second authentication path or second transport? | **Second transport / contract surface only.** One write/auth path: Imp-02 services. Analogous to dual `/functions` + `/functions/v1` mounting the same Edge handlers. |
| 6 | Better for Imp-12 purpose than Imp-13 postpone? | **YES.** `FE_COMPATIBILITY_ADAPTERS` row 1 requires password sign-in / refresh / sign-out / session at the frozen boundary. Imp-13 is production readiness, not FE contract ownership. Deferring auth out of Imp-12 leaves Imp-12 permanently partial — contradicts close-module-before-next governance (Imp-10/11 COMPLETE). |

### Ownership

| Concern | Owner |
|---|---|
| Password verify, JWT issue/verify, refresh token store, revoke | **Imp-02** — untouched |
| Compatibility routes + request/response mappers | **Imp-12** |
| FE auth UI | Frozen — unchanged |

### Explicit limits if A

- Compatibility routes only under `modules/compat/` (e.g. `/auth/v1/*` or openapi session paths evidenced)  
- Existing Imp-02 services only: `login`, `refresh`, `logout`, `getProfileById` (+ existing `requireAuth` where session probe needs it)  
- **Zero** new auth logic, JWT rewrite, session store rewrite, RBAC rewrite, password algorithm, or refresh schema  

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Satisfies FE_COMPATIBILITY auth row; Wave A adapter philosophy; Imp-12 can COMPLETE; Imp-02 remains sole auth owner | Mapper must match FE field names carefully; more compat tests |
| **B** | Less Imp-12 code | Permanent freeze gap; Imp-12 cannot be COMPLETE |
| **C** | Moves risk to Imp-13 | Imp-13 is not the compatibility module; repeats governance contradiction |

### Recommendation: **A** (**revised**)

A thin auth compatibility adapter is **safe and required** for Imp-12 completeness. It does **not** redesign authentication; it exposes another transport over the **same** Imp-02 services — identical ownership pattern to Wave A Edge/RPC adapters.

### Rejected

- **B** — leaves frozen-FE auth contract unmet forever inside Imp-12.  
- **C** — misplaces FE compatibility into Imp-13; violates finish-Imp-12-before-Imp-13.  
- Any design that reimplements JWT/refresh/RBAC inside `compat/`.
---

# DR-IMP12-B-005 — Affectations upsert

**Question:** Mimic PostgREST upsert on conflict?

### Options

| Option | Meaning |
|---|---|
| **A** | Best-effort map to Imp-05 `assignUser` (+ limits documented) |
| **B** | INSERT-only via `assignUser`; no upsert invent |
| **C** | Block all affectations writes |

### Compare

| | Advantages | Disadvantages |
|---|---|---|
| **A** | Closer to PostgREST UX | Invents conflict merge if Imp-05 has no upsert API |
| **B** | Honest: calls existing `assignUser` / `softRemoveAffectation` only | Some FE upsert flows may 409 |
| **C** | Safest | Breaks Flow B/C assignment |

### Recommendation: **B**

Imp-05 exports **assign + softRemove**, not a documented upsert. Adapter POST → `assignUser`; PATCH date_fin → `softRemoveAffectation`. No invented merge.

### Rejected

- **A** invents upsert semantics Imp-05 does not own.  
- **C** blocks READY assignment adapters without need.

---

# DR-IMP12-B-006 — Realtime protocol

**Question:** Supabase Realtime bridge in Imp-12 Wave B?

### Options

| Option | Meaning |
|---|---|
| **A** | Imp-12 builds protocol bridge |
| **B** | No — Imp-09 SSE only |
| **C** | Docs / Imp-13 |

### Recommendation: **B**

Imp-09 FINAL owns transport (SSE). Imp-10 did not invent replay. FE_COMPATIBILITY allows SSE/WS selected at implementation — Unified chose SSE. Protocol bridge is **NOT IMP-12** / cutover DEFERRED.

### Rejected

- **A** — ownership violation / invention.  
- Framing **C** as coding scope — docs-only is fine as accompaniment to B.

---

## Recommended DR answers (NOT SEALED) — B-004 revised

```
DR-IMP12-B-001 = A
DR-IMP12-B-002 = A
DR-IMP12-B-003 = C
DR-IMP12-B-004 = A
DR-IMP12-B-005 = B
DR-IMP12-B-006 = B
```

**Meaning if Human accepts:** Wave B coding = (1) dual-mounted READY table adapters + declarations GET; INSERT-only affectations; no declarations WRITE; no Realtime bridge; **and (2) thin auth compatibility adapters calling Imp-02 only**.

**Follow-on (not this seal):** Declarations UPDATE (**B-003=A**) may still be needed for full Flow E table-write parity; tracked separately. Auth is **in** this recommendation so Imp-12 is not permanently partial on the FE_COMPATIBILITY auth contract.

---

## Explicit answers

### 1. Can Wave B coding begin?

**Not yet.** Awaiting Human seal of recommended DR letters + explicit “Authorize Wave B coding.” After seal: **Yes** for READY table adapters **and** thin auth compat (B-004=A).

### 2. Production files eventually CREATED (if sealed as recommended)

| Path (illustrative) |
|---|
| `compat/tables/*` routes/controllers/mappers (chantiers, affectations, zones×3, periodes, declarations GET) |
| `compat/auth/*` routes/controller/mappers (thin → Imp-02 only) |
| `test/compat.tables.waveB*.test.js` |
| `test/compat.auth.waveB*.test.js` |

Exact names follow Wave A `profiles.routes.js` / `edge` patterns.

### 3. Production files eventually MODIFIED

| Path | Change |
|---|---|
| `api-chantier/src/modules/compat/index.js` | Mount table routers (`/tables` + `/rest/v1`) + auth compat mounts |
| Possibly `app.js` | Only if needed; prefer `mountCompat` only |

**Not modified:** `auth/service.js` business, JWT helpers, refresh SQL, Imp-03…11 repos, migrations, `chantier1/`, Imp-09 core.

### 4. Production code still FORBIDDEN

- SQL / migrations  
- Imp-02…11 business/repository rewrites (including any JWT/refresh/password rewrite in compat)  
- Declarations statut SQL/repo UPDATE  
- Realtime protocol bridge  
- Full PostgREST grammar clone  
- FE edits  
- Upsert invent beyond `assignUser`  
- Wave A Edge/RPC/profiles rewrites  
- Imp-10/11/13 scope  

### 5. Tests required (when coding authorized)

| Test | Assert |
|---|---|
| Each table GET happy path | Adapter → existing list service; FE-ish row shape |
| Chantiers POST/PATCH | Imp-04 create/update; RBAC preserved |
| Affectations POST / soft PATCH | `assignUser` / `softRemoveAffectation` |
| Zones CRUD / link / ouvrier | Imp-05 services |
| Periods CRUD | Imp-06 services; no sync fork |
| Declarations GET | Imp-06 list; **no** UPDATE routes |
| Dual mount | `/tables/x` and `/rest/v1/x` same handler behavior |
| Auth compat login/refresh/logout/session | Calls Imp-02 only; same token semantics as `/api/auth/*` |
| Auth negative | Bad password / invalid refresh still Imp-02 codes via mapper |
| Error mapping | AppError → FE-compatible where Wave A pattern exists |
| Negative | Unknown table 404; forbidden verbs 405 |

### 6. Regression suite that must pass

| Gate | Requirement |
|---|---|
| Full `api-chantier` `npm test` / `node --test test/**/*.test.js` | **All PASS** |
| Imp-04…07 domain suites | Green (adapters invoke only) |
| Wave A compat tests | Remain green (Edge/RPC/profiles) |
| Imp-09 / Imp-10 / Imp-11 | Untouched file trees; suites green |
| Diff discipline | No edits under `timesheet/`, `validation/`, `users/` business, `migrations/`, `chantier1/` except unused — **services untouched** |

---

## STOP

```
Imp-12 Wave B DESIGN REVIEW delivered.
Recommended DRs recorded (NOT SEALED).
NO production code.
Await Human Review / DR seal / coding authorization.
```
