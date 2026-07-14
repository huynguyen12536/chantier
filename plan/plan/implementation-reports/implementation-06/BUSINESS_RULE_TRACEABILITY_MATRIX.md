# BUSINESS_RULE_TRACEABILITY_MATRIX — Imp-06

| CVL / Decision rule | Code locus | Test evidence |
|---|---|---|
| SUMMARY #5 UNIQUE declaration | `declarations_heures` UNIQUE + upsert | create period → one declaration |
| SUMMARY #6 multi-period / en_cours | period insert; heure_fin null | schema CHECK |
| SUMMARY #7 empty day | Soft Annulee — DR-IMP06-001 | soft-annulee API test |
| SUMMARY #8 propagate statut | `PeriodPropagationService` | chef decide test |
| SUMMARY #9 auto-approve | `AutoApprovalPolicyService` + audit | code path; matching condition |
| SUMMARY #10 hours | CADRE / 7h — DR-IMP06-002 | domain unit test |
| DR-IMP06-003 omit nb_deplacements | upsert omits column | code review |
| DR-IMP06-003 validated_by/at | `updateDeclarationDecision` on auto | code review + SYSTEM actor |
| SUMMARY #12 visibility | affectation scoping in service/list | seed + create period |
| Permission decide | `requireRoles(admin, administratif, chef_equipe)` | ouvrier 403 test |

See also planning `BUSINESS_RULE_MATRIX.md` (pre-code SoT sync).
