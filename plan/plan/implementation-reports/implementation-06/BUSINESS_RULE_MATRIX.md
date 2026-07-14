# BUSINESS_RULE_MATRIX — Imp-06 (planning sync)

| Rule | Unified behavior | Decision / Trace |
|---|---|---|
| #5 Unique declaration | UNIQUE (user, chantier, date) | SUMMARY #5 |
| #6 Multi periods / en_cours | Allowed; fin null ↔ en_cours | SUMMARY #6 |
| #7 Sync / empty day | Soft `annulee` — no hard delete | DR-IMP06-001 |
| #8 Propagate validate/reject | Update periods terminee\|en_cours | SUMMARY #8 |
| #9 Auto-approve match | Exact prior validated shift; audit complete | SUMMARY #9 + DR-IMP06-003 |
| #10 Hours | CADRE else 7h | DR-IMP06-002 |
| #12 Site visibility | affectation ∪ zone | SUMMARY #12 |
| #15 Resubmit | rejetee → terminee | SUMMARY #15 |
| nb_deplacements | Sync does not write column | DR-IMP06-003 P+ |
| Auto-approve audit | Set validated_by + validated_at | DR-IMP06-003 F |
