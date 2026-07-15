# IMP10_WAVE_B1_REGRESSION_REPORT.md

**Date:** 2026-07-15  
**Module:** Imp-10 Wave B1  
**Baseline comparison:** Wave A closure `6662537ba6` → code head `6d10aaf038`

---

## 1. Full suite

| Gate | Result |
|---|---|
| `npm test` (`api-chantier/test/**/*.test.js`) | **105/105 PASS** |
| Prior Wave A full suite | 92/92 |
| Delta | +13 Wave B1 tests (6 M1 + 7 M2); no failures |

---

## 2. api-chantier production + test delta (Wave B1)

```
api-chantier/src/modules/jobs/handlers/realtimeRedispatch.js   (created)
api-chantier/src/modules/jobs/index.js                         (modified)
api-chantier/src/modules/jobs/jobTypes.js                      (modified)
api-chantier/src/modules/jobs/registry.js                      (modified)
api-chantier/src/modules/realtime/dispatcher.js                (modified — approved hook only)
api-chantier/test/jobs.waveB1.test.js                          (created)
api-chantier/test/jobs.waveB1.m2.test.js                       (created)
```

Stat (`6662537ba6..6d10aaf038` api-chantier): **7 files, +472 / −6**.

---

## 3. Untouched / approved-only confirmation

| Path | Wave B1 status |
|---|---|
| `src/modules/timesheet/` | **Untouched** |
| `src/modules/validation/` | **Untouched** |
| `src/modules/users/` | **Untouched** |
| `src/modules/compat/` | **Untouched** |
| `migrations/` | **Untouched** |
| `chantier1/` | **Untouched** |
| `src/modules/realtime/` except `dispatcher.js` | **Untouched** |
| `dispatcher.js` | **Approved only:** bind API + write-failure → enqueue |

`git diff 6662537ba6..6d10aaf038 --name-only` under timesheet/validation/users/compat/migrations/chantier1: **empty**.

---

## 4. Behavioral regressions checked

| Concern | Evidence |
|---|---|
| Wave A platform (noop, idempotency, disable, stop) | `jobs.waveA.test.js` PASS |
| Last-Event-ID no replay | Realtime suite PASS; DR-B-006=B; no replay code |
| SSE connect / auth / scope | Realtime suite in 105 PASS |
| Imp-06/07 business | No file edits; domain tests in 105 PASS |
| Imp-12 compat | No file edits |

---

## 5. Verdict

**PASS** — Regression clean outside the approved Wave B1 file set.
