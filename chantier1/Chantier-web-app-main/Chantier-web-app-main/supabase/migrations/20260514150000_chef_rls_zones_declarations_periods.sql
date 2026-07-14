/*
  Fix: chef sees workers via zones_equipe but RLS only allowed
  declarations_heures / periodes_travail through affectations_chantiers.

  Result: worker submits 2 lines on different chantiers, realtime fires twice,
  but chef only reads the chantier linked in affectations_chantiers.
*/

-- declarations_heures: read via zones
CREATE POLICY "Chefs can view declarations via zones"
  ON declarations_heures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = declarations_heures.user_id
        AND zc.chantier_id = declarations_heures.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );

-- declarations_heures: validate via zones
CREATE POLICY "Chefs can update declarations via zones"
  ON declarations_heures FOR UPDATE
  TO authenticated
  USING (
    statut IN ('soumise', 'validee')
    AND EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = declarations_heures.user_id
        AND zc.chantier_id = declarations_heures.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = declarations_heures.user_id
        AND zc.chantier_id = declarations_heures.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );

-- periodes_travail: read via zones
CREATE POLICY "Chefs can view periods via zones"
  ON periodes_travail FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = periodes_travail.user_id
        AND zc.chantier_id = periodes_travail.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );

-- periodes_travail: validate via zones
CREATE POLICY "Chefs can update periods via zones"
  ON periodes_travail FOR UPDATE
  TO authenticated
  USING (
    statut IN ('terminee', 'validee')
    AND EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = periodes_travail.user_id
        AND zc.chantier_id = periodes_travail.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      JOIN zones_chantiers zc ON zc.zone_id = ze.id
      WHERE zo.user_id = periodes_travail.user_id
        AND zc.chantier_id = periodes_travail.chantier_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );
