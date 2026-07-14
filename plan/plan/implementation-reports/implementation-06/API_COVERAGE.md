# API_COVERAGE — Imp-06

Frontend Contract: **frozen** (no FE changes). Paths under `/api/timesheet` expose Time Recording capability for Wave 2 backend consumers.

| Method | Path | Auth | Roles | Notes |
|---|---|---|---|---|
| GET | `/api/timesheet/periods` | JWT | authenticated | Scoped list |
| POST | `/api/timesheet/periods` | JWT | authenticated | TX: insert + sync (+ optional auto-approve) |
| PATCH | `/api/timesheet/periods/:id` | JWT | authenticated | TX: update + sync |
| DELETE | `/api/timesheet/periods/:id` | JWT | authenticated | Soft Annulee when last active |
| GET | `/api/timesheet/declarations` | JWT | authenticated | Scoped list |
| POST | `/api/timesheet/declarations/:id/decide` | JWT | admin, administratif, chef_equipe | Propagates periods |

## Contract notes
- Decision body uses declaration `statut` transitions (`validee` / `rejetee` / … per validation).  
- Imp-07 may add `/api/validation/...` aliases if FE contract requires legacy path names without changing FE itself (adapter only if evidenced).
