# IMP09_TEST_REPORT

**Date:** 2026-07-15  
**Command:** `node --test --test-concurrency=1 test/**/*.test.js`  
**Result:** **70/70 PASS** (fail 0)

---

## 1. Imp-09 cases (`test/realtime.test.js`)

| Case | Result |
|---|---|
| Serializer / heartbeat comment format | PASS |
| Scope worker / chef / admin units | PASS |
| Expand + dispatcher owns queue/dashboard sources | PASS |
| Imp-06 helper emit via hooks | PASS |
| SSE connect + disconnect | PASS |
| Last-Event-ID echoed; `lastEventIdReplay:false` | PASS |
| Heartbeat arrives | PASS |
| Auth failure 401 | PASS |
| Bearer Authorization connect | PASS |
| Cleanup registry | PASS |
| Unauthorized scope (worker) | PASS |
| Scoped chef | PASS |
| Admin receives all | PASS |
| Create/update period after COMMIT | PASS |
| Approve / reject / cancel → catalog + queue/dashboard | PASS |
| Failed create no emit | PASS |

## 2. Regression Imp-01 → Imp-08

All prior suites PASS within the same 70/70 run (Imp-01, 02, 04, 05, 06, 07, 08 + Imp-09).
