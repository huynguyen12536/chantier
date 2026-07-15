# IMP10_REGRESSION_REPORT.md

**Date:** 2026-07-15  
**Result:** **PASS — 92/92**

| Module | Touched by Imp-10 Wave A? | Status |
|---|---|---|
| Imp-01 Infrastructure | `env.js` additive keys; `server.js` lifecycle only | PASS |
| Imp-02 Auth | **No** | PASS |
| Imp-03 Users | **No** | PASS |
| Imp-04 Chantiers | **No** | PASS |
| Imp-05 Affectations/Zones | **No** | PASS |
| Imp-06 Timesheet | **No** | PASS |
| Imp-07 Review | **No** | PASS |
| Imp-08 Export | **No** | PASS |
| Imp-09 Realtime | **No** | PASS |
| Imp-11 Administration | **No** | PASS |
| Imp-12 Compat Wave A | **No** | PASS |
| Imp-10 Jobs | **Yes** (new module) | PASS |

### Evidence Imp-06…12 / FE / migrations untouched

```
git diff c82bf3d00b^..6a2a169bd1 --stat -- \
  api-chantier/src/modules/timesheet \
  api-chantier/src/modules/validation \
  api-chantier/src/modules/export \
  api-chantier/src/modules/realtime \
  api-chantier/src/modules/users \
  api-chantier/src/modules/compat \
  api-chantier/migrations \
  chantier1
```

→ **empty** (no path changes).

Wave A code paths only under `modules/jobs/`, `server.js` hooks, `config/env.js`, `.env.example`, `README.md`, `test/jobs.waveA.test.js`.
