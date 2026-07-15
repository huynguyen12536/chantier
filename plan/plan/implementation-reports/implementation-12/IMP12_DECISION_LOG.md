# IMP12_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** DRs **CLOSED** by Human authorization. Coding Wave A completed.

Inherited closed decisions (do not reopen):

- Imp-11 = Administration REST/business FINAL  
- Imp-12 = Compatibility adapters only (DR-IMP11-001)  
- No SQL in Imp-12  
- No Imp-02…11 rewrite  

---

## Closed Imp-12 decisions

| DR | Choice | Applied |
|---|---|---|
| **DR-IMP12-001** | **A** | Dual Edge `/functions` + `/functions/v1`; RPC `/rpc` + `/rest/v1/rpc` |
| **DR-IMP12-002** | **C** | Wave A ONLY — STOP after commit/push; Wave B needs new auth |
| **DR-IMP12-003** | **C** | No declarations_heures write adapter |
| **DR-IMP12-004** | **B** | No auth/session/GoTrue adapter; Imp-02 only |

Do not reopen.
