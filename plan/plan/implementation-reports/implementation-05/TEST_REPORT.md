# TEST_REPORT — Imp-05 Parity

Command: `cd api-chantier && npm test`  
Result: **31/31 PASS**

## Imp-05 parity cases
- unique assign + soft remove; **chef write** affectation
- ouvrier scoped list
- administratif cannot create zone
- ownership CRUD + forbidden other chef + soft/restore/unlink + scoped lists
- date_fin < date_debut → 400
- ouvrier forbidden writes

## Regression
Imp-01…04, Imp-06 Timesheet, Imp-07, Imp-08 — all green.
