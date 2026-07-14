# Dependency Graph Review

> **ADDENDUM 2026-07-14:** Master Plan dependency graph **đã được Decision Log chấp nhận** dưới Consolidation roadmap.  
> Nội dung “Current graph” dưới đây là **historical** (migration 1:1).  
> **Authoritative graph:** `00_README_EXECUTION.md` — P3 Merge Spec → P4 Domain → P5 DB → P6 Logic → P7 BE Arch → …

**Date:** 2026-07-14  
**Type:** Historical proposal + superseded by Consolidation Master Plan.  
**Phase 2 status:** unchanged (Technical Investigation Complete · Waiting External Confirmation)

---

## Current graph (Master Plan) — HISTORICAL

```
P0 ✅ → P1 ✅ → P2 (Waiting External Confirmation)
                    ↓ Gate
                   P3
                    ↓
                   P4
              ┌─────┴─────┐
              P5         P6
              └─────┬─────┘
                    ↓
                   P7
                    ↓
                   P8
                    ↓
                   P9
                    ↓
                   P10
                    ↓
                   P11
                    ↓
                   P12
                    ↓
                   P13
                    ↓
                   P14
```

Master Plan also notes: P7 design parallelizable with P5–P6; P4 scaffold already Partial.

---

## Findings

| Check | Result |
|---|---|
| Wrong dependency? | **Mild:** P8 lists “Phase 2 dump” — must mean **Gate-closed Database SoT**, not merely Verified Dump hzppst. Clarify, not reorder. |
| P4 before P3? | Scaffold Partial OK; **ADR Done before P3 = forbidden** (already stated). Keep. |
| P5/P6 before P7? | Sound — authn/z before porting DEFINER logic. |
| P9 before P7/P8 designs? | Risk of implementing 501 fills early — AC already blocks. Keep gate. |
| Parallel possible? | See proposals |
| Merge possible? | See proposals |
| Split possible? | See proposals |

---

## Proposals (do not auto-apply)

### P1 — Clarify P8 input

- Change wording: “Phase 2 **Gate Done** (confirmed Runtime dump)” instead of ambiguous “Phase 2 dump”.  
- **Impact:** Documentation only.

### P2 — Parallel design tracks after P3

After P3 Done, allow **parallel**:
- Track A: P4 ADR finalize  
- Track B: P7 Keep/Port/Drop **design** (not implement) using P3 owners  

P5/P6 remain after P4 ADR auth sections.  
**Impact:** Shortens calendar; no merge.

### P3 — Split Phase 9

- P9a: Auth+Users+Chantiers+Affectations+Zones  
- P9b: Timesheet+Validation+Export (+ trigger parity tests)  

**Impact:** Clearer gates; optional Decision Log.

### P4 — Do not merge P5+P6

Authn vs AuthZ reviews differ (Security). Keep separate.

### P5 — Do not merge P11 into P8

Strategy vs ETL execution must stay split (rollback/ops).

### P6 — Conditional Phase 3 (Scenario D)

Already discouraged in NEXT_ACTION_MATRIX. No graph change.

### P7 — Phase 4 Partial vs Done

Recommend status label: **Prepared scaffold · ADR Blocked on P3** to avoid “Partial = architecture halfway done”. Documentation label only.

---

## Recommended parallelization matrix (after P2 Gate + P3)

| May run in parallel | Must stay sequential |
|---|---|
| P4 ADR ⟷ P7 decision table (design) | P3 before P4 ADR Done |
| P5 design ⟷ P6 matrix build (after P4 authZ interface sketch) | P5 implement before P6 implement (token claims exist) |
| P8 DDL draft after P7 decisions | P9 implement after P4–P8 designs |
| P10 after P9 core | P11 after P8+P9; P12 after P9–11; P13 after P12 |

---

## Decision required (Human / PM)

- Accept P1 wording clarify in Master Plan?  
- Accept optional P9 split?  
- Accept parallel P4⟷P7 design?

Until Decision Log rows exist, **roadmap graph stays as-is**.
