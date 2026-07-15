# IMP12_WAVE_B_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** **FINAL / LOCKED** — Human OFFICIALLY APPROVED  
**Wave B coding:** AUTHORIZED (full Wave B)

## Locked seal

```
DR-IMP12-B-001 = A
DR-IMP12-B-002 = A
DR-IMP12-B-003 = C
DR-IMP12-B-004 = A
DR-IMP12-B-005 = B
DR-IMP12-B-006 = B
```

| DR | Choice | Meaning |
|---|---|---|
| B-001 | A | READY table adapters only |
| B-002 | A | Dual `/tables` + `/rest/v1` |
| B-003 | C | Declarations GET only |
| B-004 | A | Thin auth compat → Imp-02 |
| B-005 | B | Affectations INSERT via assignUser (no upsert invent) |
| B-006 | B | No Realtime bridge |

Inherited Wave A sealed: `001=A, 002=C, 003=C, 004=B` (Wave A). Wave B B-004=A **extends** Imp-12 with auth compat without reopening Imp-02 ownership.
