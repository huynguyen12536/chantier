/*
  # Create delete_chantier_cascade function

  Deletes a chantier and all its related records in the correct order:
  - zones_chantiers
  - affectations_chantiers
  - periodes_travail
  - declarations_heures
  - chantiers

  Only admins can call this function (checked via profiles.role).
*/

CREATE OR REPLACE FUNCTION delete_chantier_cascade(p_chantier_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  DELETE FROM zones_chantiers WHERE chantier_id = p_chantier_id;
  DELETE FROM affectations_chantiers WHERE chantier_id = p_chantier_id;
  DELETE FROM periodes_travail WHERE chantier_id = p_chantier_id;
  DELETE FROM declarations_heures WHERE chantier_id = p_chantier_id;
  DELETE FROM chantiers WHERE id = p_chantier_id;
END;
$$;
