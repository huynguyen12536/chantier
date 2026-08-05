/*
  # Fix user deletion blocked by chantiers_divers_fields_consistent

  Deleting auth.users sets chantiers.created_by to NULL (ON DELETE SET NULL).
  The divers check constraint required created_by even on approved/rejected worksites,
  which blocked admin delete-user with SQLSTATE 23514.
*/

ALTER TABLE public.chantiers
  DROP CONSTRAINT IF EXISTS chantiers_divers_fields_consistent;

ALTER TABLE public.chantiers
  ADD CONSTRAINT chantiers_divers_fields_consistent
  CHECK (
    source IS DISTINCT FROM 'divers'
    OR (
      source = 'divers'
      AND divers_statut IS NOT NULL
      AND NOT (divers_statut = 'en_attente' AND created_by IS NULL)
    )
  );
