# IMP11_INVESTIGATION_INDEX — UNION MERGE (authoritative pack)

**Date:** 2026-07-15  
**Mode:** INVESTIGATION ONLY — no production code  
**SoT formula:**

```
Unified Final Administration
  = (CVL Administration capabilities)
    UNION
    (Unified backend capabilities Imp-02→Imp-09)
```

Neither source may silently disappear. Neither replaces the other.

---

## Deliverables (this pack)

| # | Required output | File |
|---|---|---|
| 1 | UNION Capability Matrix | `IMP11_MERGE_CAPABILITY_MATRIX.md` |
| 2 | Schema Merge Report | `IMP11_SCHEMA_MERGE_REPORT.md` |
| 3 | Implementation Scope (IN / OUT / REUSE / DEFERRED) | `IMP11_IMPLEMENTATION_SCOPE.md` |
| 4 | Decision Log (ownership only) | `IMP11_DECISION_LOG.md` |
| 5 | Implementation Plan (Admin work only) | `IMP11_IMPLEMENTATION_PLAN.md` |

Supporting evidence (earlier reverse): `IMP11_FE_CONTRACT_REPORT.md`, `IMP11_TRACEABILITY.md`.  
Historical gap framing (superseded): `IMP11_GAP_ANALYSIS.md`, `IMP11_DECISION_REQUESTS.md`.

---

## Category map (mandatory vocabulary)

| Cat | Name | Imp-11 action |
|---|---|---|
| 1 | Already merged | None |
| 2 | Reuse existing implementation | Consume Imp-02…05 only |
| 3 | Needs REST endpoint only | Add HTTP surface |
| 4 | Needs additive SQL migration only | One new migration file |
| 5 | Needs Administration business implementation | Policies/guards in Users admin service |
| 6 | Deferred | Imp-12 or project Decision Log |

**Forbidden word for present capabilities:** “Missing”.

---

## FINAL VALIDATION

| Check | Result |
|---|---|
| ✓ Every CVL Administration capability still classified (exists in matrix) | **PASS** |
| ✓ Every Unified-native identity capability kept (`password_hash`, `refresh_tokens`, `actif`, JWT) | **PASS** |
| ✓ Nothing disappeared from either source | **PASS** |
| ✓ Previous Imp ownership respected (04/05/06/07/08/09 untouched) | **PASS** |
| ✓ Only one additive SQL migration required (phone + nonempty matricule UNIQUE) | **PASS** |
| ✓ Imp-11 touches only Administration (PATCH/role/guards/phone wiring) | **PASS** |
| ✓ Imp-04/05/06/07/08/09 remain untouched in plan | **PASS** |
| ✓ No production code generated in this investigation | **PASS** |

**Coding gate:** Human answers ownership DRs in `IMP11_DECISION_LOG.md` → then authorize implementation.

**STOP after investigation.**
