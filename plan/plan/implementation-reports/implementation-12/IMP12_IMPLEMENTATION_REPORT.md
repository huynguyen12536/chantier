# IMP12_IMPLEMENTATION_REPORT.md

**Date:** 2026-07-15  
**Phase:** Imp-12 — Compatibility Layer  
**Module status:** **COMPLETE**  
**Release:** **APPROVED**  
**Seal:** `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`  
**Wave A commit:** `a706e1111f`  
**Wave B / runtime head:** `d8bb5c83c0`  
**Human review:** Wave A **APPROVED**; Wave B + Architecture Review **ACCEPTED WITH KNOWN LIMITATIONS**

---

## Decisions applied (final)

### Wave A

| DR | Value |
|---|---|
| DR-IMP12-001 | A — dual Edge + RPC `/rest/v1` alias |
| DR-IMP12-002 | C — Wave A only (tables dual later via B-002) |
| DR-IMP12-003 | C — no declarations write adapter |
| DR-IMP12-004 | B — no auth adapter in Wave A |

### Wave B

| DR | Value |
|---|---|
| DR-IMP12-B-001 | A — READY table adapters |
| DR-IMP12-B-002 | A — dual `/tables` + `/rest/v1` |
| DR-IMP12-B-003 | C — declarations GET only |
| DR-IMP12-B-004 | A — thin auth → Imp-02 |
| DR-IMP12-B-005 | B — assignUser only (no upsert invent) |
| DR-IMP12-B-006 | B — no Realtime bridge |

---

## Delivered adapters

### Wave A

| Compat path | Calls (in-process) | Mapper |
|---|---|---|
| `POST /functions/create-user` (+ `/v1`) | `usersService.createUser` | `edgeUserMapper` |
| `POST /functions/delete-user` (+ `/v1`) | `usersService.deleteUser` | `edgeUserMapper` |
| `POST /rpc/delete_chantier_cascade` (+ `/rest/v1/rpc`) | `chantiersService.deleteChantierCascade` | `chantierMapper` |
| `GET/PATCH /tables/profiles` | users list/get/update | `profileMapper` |

### Wave B

| Compat path | Calls (in-process) |
|---|---|
| `/tables` + `/rest/v1` chantiers / affectations / zones* / periodes / declarations GET | Imp-04 / Imp-05 / Imp-06 |
| profiles dual-mounted on `/rest/v1` | same Wave A handlers |
| `/auth/v1/token|logout|user` | Imp-02 authService + `authMapper` |

**Module root:** `api-chantier/src/modules/compat/`  
**Mount:** `mountCompat(app)` in `app.js` — additive only.

Architecture: route → controller → **existing service** → mapper → response. No internal HTTP. No service edits Imp-02…11.

---

## Explicitly not delivered (sealed)

- declarations UPDATE adapter (**B-003=C**)  
- Realtime protocol bridge (**B-006=B**)  
- Affectation upsert invent (**B-005=B**)  
- SQL / migrations / FE changes  

---

## Tests

**112/112 PASS** — see `IMP12_TEST_REPORT.md` / `IMP12_REGRESSION_REPORT.md`.

---

## Closure

**Imp-12 is COMPLETE.** See `IMP12_FINAL_CLOSURE.md`. Do **not** start Imp-13 without Human authorization. No further Imp-12 production code.
