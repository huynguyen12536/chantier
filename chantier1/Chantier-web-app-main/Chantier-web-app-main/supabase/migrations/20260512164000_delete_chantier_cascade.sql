/*
  # Delete chantiers with related data

  Admin platform management deletes must remove dependent time periods,
  declarations, zones, and assignments before deleting the chantier itself.
*/

CREATE OR REPLACE FUNCTION public.delete_chantier_cascade(p_chantier_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
  ) THEN
    RAISE EXCEPTION 'Only admins can delete chantiers'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM periodes_travail
  WHERE chantier_id = p_chantier_id;

  DELETE FROM declarations_heures
  WHERE chantier_id = p_chantier_id;

  DELETE FROM zones_chantiers
  WHERE chantier_id = p_chantier_id;

  DELETE FROM affectations_chantiers
  WHERE chantier_id = p_chantier_id;

  DELETE FROM chantiers
  WHERE id = p_chantier_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_chantier_cascade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_chantier_cascade(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
