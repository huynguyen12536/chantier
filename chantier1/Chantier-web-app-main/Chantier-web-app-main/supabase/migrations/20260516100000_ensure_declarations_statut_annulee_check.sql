/*
  Ensure declarations_heures.statut allows 'annulee'.

  If migration 20260515120000 never ran on a remote DB, CHECK stays:
    statut IN (..., 'rejetee')  -- no annulee

  Then chef cancel (PATCH statut = annulee) fails with PostgREST error while
  validation to validee still succeeds — matches app logs (updErr after update).

  Idempotent: DROP + ADD constraint name declarations_heures_statut_check.
*/

ALTER TABLE public.declarations_heures
  DROP CONSTRAINT IF EXISTS declarations_heures_statut_check;

ALTER TABLE public.declarations_heures
  ADD CONSTRAINT declarations_heures_statut_check
  CHECK (
    statut IN ('brouillon', 'soumise', 'validee', 'rejetee', 'annulee')
  );
