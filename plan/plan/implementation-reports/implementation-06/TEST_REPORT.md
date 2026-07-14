# TEST_REPORT — Imp-06

## Command
```bash
cd api-chantier && npm test
```

## Result
**17/17 PASS** · fail 0 · duration ~1.2s

## Imp-06 cases
| Suite | Case | Result |
|---|---|---|
| Domain units | durationHours + CADRE split + 7h fallback | PASS |
| API | create period + sync declaration soumise (TX) | PASS |
| API | soft-annulee when last period deleted (DR-001) | PASS |
| API | chef decides + propagates periods | PASS |
| API | ouvrier cannot decide (403) | PASS |

## Other modules (regression)
Imp-01…05 suites — all PASS (no regressions).

## Gates covered by suite
Unit · Integration (HTTP+DB) · Regression · Permission · Transactional create/delete/decide path.
