# DATABASE_GOVERNANCE_UPDATE

**Date:** 2026-07-14  
**Type:** Permanent governance (documentation only — no Imp-07)  
**Cause:** Imp-05 agent assumed “dump missing ⇒ remove UNIQUE”

## What changed

| Artifact | Change |
|---|---|
| `DATABASE_EVOLUTION_POLICY.md` | **Created** — Rules 1–10 |
| `AGENTIC_EXECUTION_MANUAL.md` | Added § DATABASE EVOLUTION INVARIANTS; SoT order aligned to Rule 6 |
| `00_README_EXECUTION.md` | Pointer to Database Evolution Policy |
| Decision Log | Governance invariant row |
| Status Board | Governance update recorded; Imp-07 still STOP |
| `IMPLEMENTATION_REPORT` Imp-05 SCHEMA / rework | Language corrected toward **absence is not evidence** |
| Merge overview | Short UNION reminder |
| ADR-001 note / Architecture overview | Pointer to policy |

## Invariants summarized

1. Unified DB = UNION  
2. Absence ≠ evidence  
3. Destructive SQL forbidden by default  
4. Additive preferred  
5. Default KEEP on conflict  
6. Evidence priority (Decision Log → … → dumps last)  
7. Removal needs full approval set + Human  
8. No migration history rewrite — additive correctives  
9. Review P2 ≠ auto-FAIL  
10. No silent decisions (Origin/Reason/Evidence/Decision/Impact/Rollback)

## Future impact

- Wave 2 agents MUST refuse silent DROP.  
- Parity patches compare sources but **keep** until Decision Log + Human.  
- Review FAIL on destructive migrations without Rule 7 package.  
- Imp-07+ blocked until human authorizes resume after this governance SHA.

## Consistency validation

| Check | Result |
|---|---|
| Policy file exists | PASS — `DATABASE_EVOLUTION_POLICY.md` |
| Manual §9 invariants | PASS |
| Architecture Governance pointer | PASS |
| Evidence Priority in Manual §3 = Rule 6 | PASS |
| `api-chantier/migrations` DROP* | PASS — none |
| Imp-07 started | **FAIL if true** — must remain STOP (this task: STOP) |
| Phrases prescribing “dump missing ⇒ remove” as future guidance | PASS — only historical incident language in Imp-05 rework |

## Commit SHA

`25e0db2fcb8dae7ed0f8bc18fa166ace1447ece7`
