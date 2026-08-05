# ETL_REPAIR_PLAN.md

**PLAN ONLY — DO NOT IMPLEMENT until Human Review**  
**Compared at:** 2026-07-15T15:38:02.126Z  
**Verdict:** BUSINESS DATA LOSS

| # | Issue | Class | Repair |
|---|---|---|---|
| 1 | Original auth not migrated | LOST AUTHENTICATION | Export auth.users hashes OR mandated reset + user communication |
| 2 | GPS 4→2 | LOST + CAPABILITY LOSS | Add latitude_fin/longitude_fin OR accept permanent capability loss in writing |
| 3 | commentaire absent | LOST + CAPABILITY LOSS | ALTER add column + reimport |
| 4 | Hours single-window→2-slot | LOST (semantics) / partial clock TRANSFORMED | Document FE contract OR store original window + derive slots |
| 5 | Email collision discarded fields | MERGED + LOST | Manual attribute merge for joseph.ad (nom/matricule/phone) |
| 6 | Synthetic password / updated_at | DEFAULTED / GENERATED | Never call MATCH or SAFE |

**STOP — Await Human Review.**
