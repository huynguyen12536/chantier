
CREATE POLICY "Chefs can delete team periods"
  ON periodes_travail FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.user_id = periodes_travail.user_id AND a.chantier_id = periodes_travail.chantier_id AND a.chef_equipe_id = auth.uid())
    OR EXISTS (SELECT 1 FROM zones_ouvriers zo JOIN zones_equipe ze ON ze.id = zo.zone_id WHERE zo.user_id = periodes_travail.user_id AND ze.chef_equipe_id = auth.uid() AND zo.date_fin IS NULL)
  );

CREATE POLICY "Admins can delete any period"
  ON periodes_travail FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administratif')));

CREATE POLICY "Chefs can delete team declarations"
  ON declarations_heures FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.user_id = declarations_heures.user_id AND a.chantier_id = declarations_heures.chantier_id AND a.chef_equipe_id = auth.uid())
    OR EXISTS (SELECT 1 FROM zones_ouvriers zo JOIN zones_equipe ze ON ze.id = zo.zone_id WHERE zo.user_id = declarations_heures.user_id AND ze.chef_equipe_id = auth.uid() AND zo.date_fin IS NULL)
  );

CREATE POLICY "Admins can delete any declaration"
  ON declarations_heures FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administratif')));
