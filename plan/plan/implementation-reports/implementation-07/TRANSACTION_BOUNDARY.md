# TRANSACTION_BOUNDARY — Imp-07

| Command | TX contents |
|---|---|
| approve/reject | UPDATE declaration (soumise→*) + propagate periods |
| cancel | UPDATE declaration annulee + DELETE periods |
| period decide | UPDATE period statut + audit |

All via `withTransaction`. Fail → full rollback.
