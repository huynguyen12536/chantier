# BUSINESS_RULE_TRACEABILITY_MATRIX — Imp-07

| Rule | Code | Test |
|---|---|---|
| #8 propagate on validate/reject | PeriodPropagationService | approve audit test |
| #11 chef scope | chefScope.getChefChantierIds | FORBIDDEN_SCOPE test |
| #15 resubmit | Imp-06 period update | Imp-06 suite |
| Flow E cancel | annulee + DELETE periods | cancel test |
| Concurrency soumise-only | conditional UPDATE | 409 double approve |
| Audit validated_by/at | applyDeclarationDecision | approve test |
| Auto-approve (rule 9) | Imp-06 AutoApprovalPolicyService | unchanged ownership |
