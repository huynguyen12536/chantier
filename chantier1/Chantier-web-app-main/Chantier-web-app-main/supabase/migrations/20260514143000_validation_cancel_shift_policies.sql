/*
  Allow chefs and admins to cancel pending shift registrations
  from the weekly validation screen.
*/

-- Chefs can delete pending periods for their team (affectations or zones)
CREATE POLICY "Chefs can delete team pending periods"
  ON periodes_travail FOR DELETE
  TO authenticated
  USING (
    statut IN ('en_cours', 'terminee')
    AND (
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
    )
  );

-- Admins can delete pending periods
CREATE POLICY "Admins can delete pending periods"
  ON periodes_travail FOR DELETE
  TO authenticated
  USING (
    statut IN ('en_cours', 'terminee')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'administratif')
    )
  );

-- Chefs can delete pending declarations for their team
CREATE POLICY "Chefs can delete team pending declarations"
  ON declarations_heures FOR DELETE
  TO authenticated
  USING (
    statut = 'soumise'
    AND (
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
    )
  );

-- Admins can delete pending declarations
CREATE POLICY "Admins can delete pending declarations"
  ON declarations_heures FOR DELETE
  TO authenticated
  USING (
    statut = 'soumise'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'administratif')
    )
  );
