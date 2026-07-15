# IMP10_WAVE_B1_TEST_REPORT.md

**Date:** 2026-07-15  
**Module:** Imp-10 Wave B1  
**Code head:** `6d10aaf038`

---

## 1. Tests added

| File | Count | Focus |
|---|---|---|
| `api-chantier/test/jobs.waveB1.test.js` | 6 | M1 — registry, handler → `dispatchCatalogEvent`, invalid payload, enqueue/complete, idempotency |
| `api-chantier/test/jobs.waveB1.m2.test.js` | 7 | M2 — success no-enqueue, failure once, payload, runner+dispatch once, duplicate key, skip storm, unbound API |

**Total Wave B1 job tests:** 13  

---

## 2. Cases covered (M2)

| Case | Result |
|---|---|
| writeEvent success → no enqueue | PASS |
| writeEvent failure → enqueue exactly once (2 failing clients) | PASS |
| enqueue payload correctness (+ `_skipRedispatchEnqueue`) | PASS |
| runner executes JB-01; dispatch once | PASS |
| duplicate idempotencyKey rejected | PASS |
| `_skipRedispatchEnqueue` prevents re-enqueue | PASS |
| unbound jobs API → quiet failure path | PASS |

---

## 3. Retained suites

| Suite | Result |
|---|---|
| `test/jobs.waveA.test.js` (12) | PASS |
| Imp-09 `test/realtime.test.js` (incl. Last-Event-ID no-replay) | PASS (in full suite) |
| Full `npm test` (`test/**/*.test.js`) | **105/105 PASS** |

---

## 4. How to re-run

```bash
cd api-chantier
node --test test/jobs.waveB1.test.js test/jobs.waveB1.m2.test.js test/jobs.waveA.test.js
npm test
```

---

## 5. Verdict

**PASS** — Wave B1 tests green; full regression green at M2 close.
