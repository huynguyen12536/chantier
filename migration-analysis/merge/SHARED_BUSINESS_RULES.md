# Shared Business Rules — CVL Preservation Register

“Shared” means shared by the proposed Unified Platform baseline and CVL; it does not assert PLD has the rule. Every item traces to the CVL rule catalog.

| # | Rule to preserve/map | Trace |
|---|---|---|
| 1 | Roles are `ouvrier`, `chef_equipe`, `administratif`, or `admin`. | `SUMMARY.md` §5 rule 1; Flow A |
| 2 | Only admin/administratif create users; only admin deletes users. | SUMMARY §5 rule 2; Flow A |
| 3 | Do not self-delete or delete a user with an owned chef zone. | SUMMARY §5 rule 3; `auth-flow.md` §4 |
| 4 | Assignment is unique per user/worksite and ends softly via `date_fin`. | SUMMARY §5 rule 4; Flow B |
| 5 | Declaration is unique per user/worksite/date. | SUMMARY §5 rule 5; ER §2.4 |
| 6 | Open period has null end; multiple periods per day are allowed. | SUMMARY §5 rule 6; Flow D |
| 7 | Periods generate declaration; a submitted declaration can become cancelled when periods end. | SUMMARY §5 rule 7; Flow D |
| 8 | Validating/rejecting a declaration propagates to applicable periods. | SUMMARY §5 rule 8; Flow E |
| 9 | A single period exactly matching the latest validated shift may auto-approve. | SUMMARY §5 rule 9; Flow D |
| 10 | Worksite schedule separates normal/overtime; absent a schedule, fallback is 7h. | SUMMARY §5 rule 10; `calculer_heures_cadre_chantier.md` |
| 11 | Chef visibility/approval is scoped by assignment, zone, supervision, and `get_chef_chantier_ids`. | SUMMARY §5 rule 11; `rls-analysis.md` §62–95 |
| 12 | Worker worksite visibility is direct assignment union zone membership. | SUMMARY §5 rule 12; Flow C/D |
| 13 | Worksite deletion cascades periods, declarations, zone links, assignments, then worksite. | SUMMARY §5 rule 13; Flow B |
| 14 | Export normally uses validated data at the UI. | SUMMARY §5 rule 14; Flow F |
| 15 | A rejected period can be resubmitted as completed under authorization rules. | SUMMARY §5 rule 15; `rls-analysis.md` §72–80 |

Where dump and repository once differed (C-03/C-04/C-08/C-09), Unified Platform winners are Decision Log **DR-IMP06-001 Soft Annulee**, **DR-IMP06-002 CADRE**, **DR-IMP06-003 P+Fsplit**.
