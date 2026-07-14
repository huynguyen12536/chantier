# IMP07_BUSINESS_VALIDATION

**Verdict: PASS**

| Rule | Evidence | Result |
|---|---|---|
| Flow E approve/reject → periods | `syncPeriodsFromDeclaration` after conditional UPDATE | PASS |
| Flow E cancel → declaration annulee + DELETE periods | cancel path + Soft Annulee (declaration kept) | PASS |
| SUMMARY #8 | Periods get `validee`/`rejetee` | PASS |
| SUMMARY #11 chef scope | `assertCanReviewChantier` / `getChefChantierIds` | PASS |
| SUMMARY #15 resubmit | Still Timesheet write (Imp-06 frozen); Return → `rejetee` enables it | PASS |
| Roles | Worker cannot review; chef/admin/administratif can | PASS |
| Return | Mapped to `rejetee` + audit `return` (no invented statut) | PASS |
| Concurrency | Conditional UPDATE → 409; state unchanged | PASS |
| Audit | `approval_audit_events` on human decisions | PASS |
| Auto-approve audit | Deferred (Imp-06 freeze) | Accepted drift |

DR-001/002/003: **unchanged**.
