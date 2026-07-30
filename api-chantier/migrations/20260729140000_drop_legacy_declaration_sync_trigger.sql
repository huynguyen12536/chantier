/*
  Drop legacy DB trigger that UPSERTs declarations_heures from
  synthese_heures_journalieres (removed in Imp-06 — calculation lives in api-chantier).

  Without this view the trigger fails on every periodes_travail INSERT and blocks
  ATN suggestion confirm (and all period creation paths that hit the API).
  Declaration sync is handled in timesheetService.createPeriod → declarationSync.js.
*/

DROP TRIGGER IF EXISTS trigger_sync_declarations ON public.periodes_travail;
