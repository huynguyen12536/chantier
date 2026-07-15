# IMP12_DECISION_LOG.md

**Date:** 2026-07-15  
**Status:** Wave A DRs **CLOSED**; Wave B DRs **CLOSED / SEALED**  
**Module:** Imp-12 — **COMPLETE**  
**Release:** **APPROVED**  
**Seal:** `IMPLEMENTATION ACCEPTED WITH KNOWN LIMITATIONS`  
**Runtime head:** `d8bb5c83c0`

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
| **DR-IMP12-002** | **C** | Wave A ONLY — Wave B table dual mount authorized separately by B-002 |
| **DR-IMP12-003** | **C** | No declarations_heures write adapter (Wave A) |
| **DR-IMP12-004** | **B** | No auth/session/GoTrue adapter (Wave A) — superseded for delivery by B-004=A |

Wave A code: `a706e1111f`. Review: `IMP12_WAVE_A_REVIEW.md`.

---

## Closed Imp-12 Wave B decisions (Human OFFICIALLY APPROVED)

Full options + rationale: `IMP12_WAVE_B_DESIGN_REVIEW.md`. Canonical seal: `IMP12_WAVE_B_DECISION_LOG.md`.

```
DR-IMP12-B-001 = A   # READY table adapters only
DR-IMP12-B-002 = A   # dual /tables + /rest/v1
DR-IMP12-B-003 = C   # declarations GET only
DR-IMP12-B-004 = A   # thin auth compat → Imp-02 only
DR-IMP12-B-005 = B   # affectations INSERT via assignUser (no upsert invent)
DR-IMP12-B-006 = B   # no Realtime bridge — Imp-09
```

Wave B code: `d8bb5c83c0`. Architecture review: `IMP12_FINAL_ARCHITECTURE_RELEASE_REVIEW.md`. Closure: `IMP12_FINAL_CLOSURE.md`.

**Do not reopen** without new Human authorization.
