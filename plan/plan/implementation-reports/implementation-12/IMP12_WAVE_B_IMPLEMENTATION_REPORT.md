# Imp-12 Wave B — Implementation Report (coding complete; awaiting Human Review)

**Date:** 2026-07-15  
**Status:** Implemented + full `api-chantier` test suite green — **not** Phase Closure  
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

`test/compat.waveB.test.js` + full `npm test`.
