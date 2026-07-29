-- Shift duration variance reason (nullable, FE-enforced when required).
ALTER TABLE public.periodes_travail
  ADD COLUMN IF NOT EXISTS commentaire text;

COMMENT ON COLUMN public.periodes_travail.commentaire IS
  'Raison obligatoire si la durée du créneau diffère du cadre horaire du chantier';
