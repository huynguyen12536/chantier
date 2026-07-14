# ARCHITECTURE_REPORT — Imp-06

## Module layout
```
modules/timesheet/
  dto.js / validation.js
  controller.js / routes.js
  repository.js
  domain/timeUtility.js, calculation.js
  services/
    timesheetService.js      (orchestrator)
    declarationSync.js       (ex-trigger sync)
    periodPropagation.js     (ex-trigger periods from declaration)
    autoApproval.js          (ex-auto_approve function)
```

## Principles applied
- **No SQL business logic** — migration DDL + indexes only.  
- **Replace legacy triggers/functions** with application services (Legacy Mapping Matrix).  
- **Single write path** — period mutations sync declaration inside one TX.  
- **Review & Approval ownership** — decide + auto-approve policy; Time Recording owns period projection.  
- **System actor UUID** for auto-approve audit attribution (DR-IMP06-003).

## Dependencies
Imp-02 Auth · Imp-03 Profiles · Imp-04 Chantiers (cadre hours) · Imp-05 Affectations.

## Next architecture slice
Imp-07 Review & Approval — enrich transitions, scoped approval, possible FE path adapters.
