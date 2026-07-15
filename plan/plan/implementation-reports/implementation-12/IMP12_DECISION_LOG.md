# IMP12_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** Wave A DRs **CLOSED**; Wave B DRs **RECOMMENDED — NOT SEALED**

Inherited closed decisions (do not reopen without Human):

- Imp-11 = Administration REST/business FINAL  
- Imp-12 = Compatibility adapters only (DR-IMP11-001)  
- No SQL in Imp-12  
- No Imp-02…11 rewrite  

---

## Closed Imp-12 Wave A decisions

| DR | Choice | Applied |
|---|---|---|
| **DR-IMP12-001** | **A** | Dual Edge `/functions` + `/functions/v1`; RPC `/rpc` + `/rest/v1/rpc` |
| **DR-IMP12-002** | **C** | Wave A ONLY — Wave B needs new authorization |
| **DR-IMP12-003** | **C** | No declarations_heures write adapter (Wave A) |
| **DR-IMP12-004** | **B** | No auth/session/GoTrue adapter (Wave A) |

---

## Wave B recommended answers (Design Review — **NOT SEALED**)

Full options + rationale: `IMP12_WAVE_B_DESIGN_REVIEW.md` (B-004 **revised**).

```
DR-IMP12-B-001 = A   # READY table adapters only
DR-IMP12-B-002 = A   # dual /tables + /rest/v1
DR-IMP12-B-003 = C   # declarations GET only
DR-IMP12-B-004 = A   # thin auth compat → Imp-02 only (REVISED)
DR-IMP12-B-005 = B   # affectations INSERT-only (assignUser)
DR-IMP12-B-006 = B   # no Realtime bridge — Imp-09
```

**B-004 revision:** Thin adapter is Wave A-equivalent transport over Imp-02; required for Imp-12 COMPLETE vs frozen FE auth contract. Not sealed until Human confirms.

**Not sealed.** Coding blocked until Human confirms letters + authorizes Wave B coding.
