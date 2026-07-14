
CREATE POLICY "Chefs can view affectations on supervised chantiers"
  ON affectations_chantiers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM affectations_chantiers supervisor
      WHERE supervisor.chantier_id = affectations_chantiers.chantier_id
        AND supervisor.chef_equipe_id = auth.uid() AND supervisor.date_fin IS NULL)
  );

CREATE POLICY "Chefs can view declarations on supervised chantiers"
  ON declarations_heures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = declarations_heures.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL));

CREATE POLICY "Chefs can update declarations on supervised chantiers"
  ON declarations_heures FOR UPDATE TO authenticated
  USING (statut IN ('soumise', 'validee') AND EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = declarations_heures.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL))
  WITH CHECK (EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = declarations_heures.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL));

CREATE POLICY "Chefs can view periods on supervised chantiers"
  ON periodes_travail FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = periodes_travail.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL));

CREATE POLICY "Chefs can update periods on supervised chantiers"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (statut IN ('terminee', 'validee', 'en_cours') AND EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = periodes_travail.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL))
  WITH CHECK (EXISTS (SELECT 1 FROM affectations_chantiers a WHERE a.chantier_id = periodes_travail.chantier_id AND a.chef_equipe_id = auth.uid() AND a.date_fin IS NULL));
