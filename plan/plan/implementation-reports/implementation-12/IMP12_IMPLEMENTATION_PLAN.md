# IMP12_IMPLEMENTATION_PLAN.md

**Date:** 2026-07-15  
**Status:** Investigation — **waiting Human approval / DR answers**  
**No code until authorized.**

---

## Goal

Ship a thin **compat** Express module that remaps frozen CVL FE shapes onto **existing** Unified REST/services.

---

## Recommended delivery waves

### Wave A — Admin + cascade adapters (minimum unlock)

Matches Human expected examples + Imp-11 Category 6 deferral.

| Step | Deliverable | Calls |
|---|---|---|
| A1 | Create `src/modules/compat/` (routes, controllers, mappers only) | — |
| A2 | Mount `POST /functions/create-user` (+ optional `/functions/v1/…`) | users.create |
| A3 | Mount `POST /functions/delete-user` (+ optional `/functions/v1/…`) | users.remove |
| A4 | Mount `POST /rpc/delete_chantier_cascade` | chantiers.deleteChantierCascade |
| A5 | Mount `GET/PATCH /tables/profiles` (+ `/:id` if needed) | users list/get/update |
| A6 | Tests: Edge create/delete envelopes; RPC cascade; profiles PATCH | no service rewrites |
| A7 | Docs: IMP12_IMPLEMENTATION_REPORT / TEST / REGRESSION | — |

**Estimated files:** `compat/routes.js`, `edge.controller.js`, `rpc.controller.js`, `tables.profiles.controller.js`, `mappers.js`, `test/compat.*.test.js`; `app.js` mount only.

### Wave B — Remaining FE contract tables (evidenced)

Gates: **DR-IMP12-002** = proceed.

| Table | Adapter verbs | Target Unified |
|---|---|---|
| `chantiers` | GET/POST/PATCH | `/api/chantiers` |
| `affectations_chantiers` | GET/POST/PATCH(soft) | `/api/affectations` |
| `zones_equipe` | GET/POST/PATCH/DELETE | `/api/zones` |
| `zones_chantiers` | POST/DELETE | zone link/unlink |
| `zones_ouvriers` | POST/PATCH | zone ouvriers |
| `periodes_travail` | GET/POST/PATCH/DELETE | `/api/timesheet/periods` |
| `declarations_heures` | GET + mapped PATCH | timesheet/validation (**DR-003**) |

### Wave C — Auth session (optional expansion)

Gates: **DR-IMP12-004**.

| Adapter | Target |
|---|---|
| Sign-in / refresh / logout / session shape | Imp-02 `/api/auth/*` with Supabase-compatible JSON if required |

Realtime protocol: **not** in default Imp-12 plan (Imp-09 SSE remains SoT).

---

## Implementation rules (when coding)

1. Adapters call **service functions** already exported by Imp modules — prefer direct import of services over HTTP self-fetch (same process, same auth context).
2. Controllers contain **only** path/body/response translation.
3. On Unified `AppError`, map to FE-compatible `{ error: string }` for Edge paths; preserve correlation where harmless.
4. Never `ALTER` schema; never edit Imp-02…11 service/repo/validation.
5. CORS: Edge functions historically return permissive CORS — match on Edge adapter routes for browser FE if needed (**additive headers only**).

---

## Test plan (compat only)

| Test | Assert |
|---|---|
| create-user adapter | 201 Edge shape; profile exists via existing CREATE path |
| delete-user adapter | success envelope; self-delete / zone chef still blocked by Imp-03 |
| delete_chantier_cascade adapter | chantier gone; children cleared by Imp-04 |
| profiles PATCH adapter | Imp-11 role lock / demotion still enforced (prove no business fork) |
| Regression | Full suite Imp-01…11 still PASS |

---

## Stop conditions

- After Wave A (or A+B per Human): commit, push, **STOP** for review.
- Do **not** start Super Admin, FE edits, or Imp business rewrites.

---

## Approval gate

Human must confirm:

1. Proceed with Wave A now? (Y/N)  
2. Answer / waive **DR-IMP12-001…004** in `IMP12_DECISION_LOG.md`  
3. Include Wave B in same Imp-12 commit batch? (Y/N)

Until then: **no adapter implementation**.
