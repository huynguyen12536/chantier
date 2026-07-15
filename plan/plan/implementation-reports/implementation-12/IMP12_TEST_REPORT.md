# IMP12_TEST_REPORT.md

**Date:** 2026-07-15  
**Command:** `node --test --test-concurrency=1 test/**/*.test.js`  
**Result:** **80/80 PASS**

## Imp-12 Wave A (`test/compat.waveA.test.js`)

| Case | Result |
|---|---|
| `POST /functions/create-user` + `/functions/v1` alias | PASS |
| `POST /functions/delete-user` + self-delete blocked (Imp-03) | PASS |
| `POST /rpc/delete_chantier_cascade` + `/rest/v1/rpc` alias | PASS |
| `GET/PATCH /tables/profiles` + Imp-11 role lock via adapter | PASS |

No Wave B / declarations / auth adapter tests (OUT of Wave A).
