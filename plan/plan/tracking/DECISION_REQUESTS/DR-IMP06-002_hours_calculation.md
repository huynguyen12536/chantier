# Decision Request — DR-IMP06-002

**Status:** ⏳ Waiting Human  
**Module:** Wave 2 Imp-06 Timesheet  
**Blocks:** TimesheetCalculationService  
**Related:** Conflict Matrix **C-03**; SUMMARY #10

## Context

| Source | Hours synthesis |
|---|---|
| Dump `hzppst` view `synthese_heures_journalieres` | `LEAST(total,7)` / `GREATEST(total-7,0)` — **fixed 7h** |
| Repo | `calculer_heures_cadre_chantier` using chantier cadre times; fallback 7h if no cadre |

FE displays heures from DB/view path; chantier form stores `heure_*` cadre fields.

## Options

| ID | Choice |
|---|---|
| **7H** | Always fixed 7h split (dump) |
| **CADRE** | Cadre function when set; else 7h (repo) |

## Recommendation

**CADRE** — matches chantier data FE already collects; dump 7h treated as undeployed migration drift — **Product must confirm**.

## Requested

Reply **7H** or **CADRE**.
