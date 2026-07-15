# IMP12_TEST_REPORT.md

**Date:** 2026-07-15  
**Command:** `npm test` (`node --test test/**/*.test.js`)  
**Result:** **112/112 PASS** (Wave B close / formal closure)  
**Runtime head:** `d8bb5c83c0`

## Imp-12 Wave A (`test/compat.waveA.test.js`)

| Case | Result |
|---|---|
| `POST /functions/create-user` + `/functions/v1` alias | PASS |
| `POST /functions/delete-user` + self-delete blocked (Imp-03) | PASS |
| `POST /rpc/delete_chantier_cascade` + `/rest/v1/rpc` alias | PASS |
| `GET/PATCH /tables/profiles` + Imp-11 role lock via adapter | PASS |

Wave A land count (historical): 80/80.

## Imp-12 Wave B (`test/compat.waveB.test.js`)

| Case | Result |
|---|---|
| Thin auth `/auth/v1` token + user + refresh + logout → Imp-02 | PASS |
| chantiers dual `/tables` + `/rest/v1`; RBAC preserved | PASS |
| profiles dual-mounted on `/rest/v1` (B-002) | PASS |
| affectations_chantiers assignUser + soft-remove (B-005=B) | PASS |
| zones_equipe / zones_chantiers / zones_ouvriers → Imp-05 | PASS |
| periodes_travail CRUD + declarations_heures GET only (B-003=C) | PASS |
| RPC dual mount still works beside `/rest/v1` tables | PASS |

## Module status

Imp-12 **COMPLETE**. Release **APPROVED**. Seal: `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`.
