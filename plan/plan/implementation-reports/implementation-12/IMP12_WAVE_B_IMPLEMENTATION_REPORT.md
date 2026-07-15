# Imp-12 Wave B — Implementation Report

**Date:** 2026-07-15  
**Status:** **COMPLETE** — Imp-12 module CLOSED  
**Release:** **APPROVED**  
**Seal:** `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`  
**Commit:** `d8bb5c83c0`  
**DR seal (locked):** `B-001=A, B-002=A, B-003=C, B-004=A, B-005=B, B-006=B`

## Surface delivered

| Area | Paths | Service reuse |
|---|---|---|
| Auth thin adapter | `POST /auth/v1/token`, `POST /auth/v1/logout`, `GET /auth/v1/user` | Imp-02 login/refresh/logout/getProfileById + existing middleware |
| chantiers | `/tables` + `/rest/v1` | Imp-04 |
| affectations_chantiers | dual | Imp-05 assignUser / softRemove / list |
| zones_equipe / zones_chantiers / zones_ouvriers | dual | Imp-05 zones |
| periodes_travail | dual | Imp-06 |
| declarations_heures | dual **GET only** | Imp-06 listDeclarations |
| profiles (Wave A) | dual-mounted under `/rest/v1` | unchanged services |

Adapters call existing services only. No SQL, migrations, JWT/RBAC reimplementation, declaration writes, Realtime bridge, or FE changes.

## Tests

`test/compat.waveB.test.js` + full `npm test` — **112/112 PASS**.

## Known limitations (sealed)

- B-003=C — no declarations writes  
- B-005=B — no upsert invent  
- B-006=B — no Realtime bridge  

## Closure

See `IMP12_FINAL_CLOSURE.md` · `IMP12_PHASE_COMPLETION_CHECKLIST.md` · `IMP12_RELEASE_NOTE.md`.
