/*
  # Fix: chef/admin can cancel (DELETE) declarations of any status

  Previous policies only allowed DELETE when statut = 'soumise'.
  Chefs and admins need to cancel already-validated or rejected declarations too.

  Also extend periodes_travail DELETE to cover 'validee' and 'rejetee' statuses
  so cancelation fully cleans up all related period rows.
*/

-- Drop old restrictive delete policies
DROP POLICY IF EXISTS "Chefs can delete team pending periods" ON periodes_travail;
DROP POLICY IF EXISTS "Admins can delete pending periods" ON periodes_travail;
DROP POLICY IF EXISTS "Chefs can delete team pending declarations" ON declarations_heures;
DROP POLICY IF EXISTS "Admins can delete pending declarations" ON declarations_heures;

-- Chefs can delete ANY period for their team (via zones or affectations)
CREATE POLICY "Chefs can delete team periods"
  ON periodes_travail FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = periodes_travail.user_id
        AND a.chantier_id = periodes_travail.chantier_id
        AND a.chef_equipe_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      WHERE zo.user_id = periodes_travail.user_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );

-- Admins can delete ANY period
CREATE POLICY "Admins can delete any period"
  ON periodes_travail FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'administratif')
    )
  );

-- Chefs can delete ANY declaration for their team (via zones or affectations)
CREATE POLICY "Chefs can delete team declarations"
  ON declarations_heures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = declarations_heures.user_id
        AND a.chantier_id = declarations_heures.chantier_id
        AND a.chef_equipe_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      WHERE zo.user_id = declarations_heures.user_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );

-- Admins can delete ANY declaration
CREATE POLICY "Admins can delete any declaration"
  ON declarations_heures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'administratif')
    )
  );
