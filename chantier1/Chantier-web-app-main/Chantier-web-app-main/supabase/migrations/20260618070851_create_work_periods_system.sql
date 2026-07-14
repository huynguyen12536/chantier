
CREATE TABLE IF NOT EXISTS periodes_travail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  heure_debut time NOT NULL,
  heure_fin time,
  latitude_debut decimal(10, 8) NOT NULL,
  longitude_debut decimal(11, 8) NOT NULL,
  latitude_fin decimal(10, 8),
  longitude_fin decimal(11, 8),
  statut text DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee', 'validee', 'rejetee')),
  commentaire text,
  validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (heure_fin IS NULL AND statut = 'en_cours') OR
    (heure_fin IS NOT NULL AND statut != 'en_cours')
  ),
  CHECK (
    (latitude_fin IS NULL AND longitude_fin IS NULL AND heure_fin IS NULL) OR
    (latitude_fin IS NOT NULL AND longitude_fin IS NOT NULL AND heure_fin IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_periodes_user_date ON periodes_travail(user_id, date);
CREATE INDEX IF NOT EXISTS idx_periodes_chantier ON periodes_travail(chantier_id);
CREATE INDEX IF NOT EXISTS idx_periodes_statut ON periodes_travail(statut);
CREATE INDEX IF NOT EXISTS idx_periodes_date ON periodes_travail(date);

ALTER TABLE periodes_travail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own periods"
  ON periodes_travail FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chefs can view their team periods"
  ON periodes_travail FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = periodes_travail.user_id
      AND a.chantier_id = periodes_travail.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all periods"
  ON periodes_travail FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can insert own periods"
  ON periodes_travail FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own non-validated periods"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND statut IN ('en_cours', 'terminee'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chefs can update team periods for validation"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = periodes_travail.user_id
      AND a.chantier_id = periodes_travail.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
    AND statut IN ('terminee', 'validee')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = periodes_travail.user_id
      AND a.chantier_id = periodes_travail.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all periods"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can delete own non-validated periods"
  ON periodes_travail FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND statut IN ('en_cours', 'terminee'));

CREATE OR REPLACE FUNCTION calculer_duree_periode(heure_debut time, heure_fin time)
RETURNS decimal(4,2) AS $$
BEGIN
  IF heure_fin IS NULL THEN RETURN 0; END IF;
  RETURN EXTRACT(EPOCH FROM (heure_fin - heure_debut)) / 3600.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW synthese_heures_journalieres AS
SELECT 
  user_id, chantier_id, date,
  SUM(calculer_duree_periode(heure_debut, heure_fin)) as total_heures,
  LEAST(SUM(calculer_duree_periode(heure_debut, heure_fin)), 7.0) as heures_normales,
  GREATEST(SUM(calculer_duree_periode(heure_debut, heure_fin)) - 7.0, 0.0) as heures_supplementaires,
  CASE 
    WHEN SUM(calculer_duree_periode(heure_debut, heure_fin)) > 9.0 THEN 2
    WHEN SUM(calculer_duree_periode(heure_debut, heure_fin)) > 4.0 THEN 1
    ELSE 0
  END as nb_paniers,
  CASE 
    WHEN BOOL_AND(statut = 'validee') THEN 'validee'
    WHEN BOOL_OR(statut = 'en_cours') THEN 'brouillon'
    ELSE 'soumise'
  END as statut,
  MAX(updated_at) as updated_at
FROM periodes_travail
WHERE statut != 'rejetee'
GROUP BY user_id, chantier_id, date;

CREATE OR REPLACE FUNCTION sync_declarations_from_periods()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO declarations_heures (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, updated_at)
  SELECT user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, NOW()
  FROM synthese_heures_journalieres
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND chantier_id = COALESCE(NEW.chantier_id, OLD.chantier_id)
    AND date = COALESCE(NEW.date, OLD.date)
  ON CONFLICT (user_id, chantier_id, date)
  DO UPDATE SET
    heures_normales = EXCLUDED.heures_normales,
    heures_supplementaires = EXCLUDED.heures_supplementaires,
    nb_paniers = EXCLUDED.nb_paniers,
    statut = EXCLUDED.statut,
    updated_at = NOW();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_declarations ON periodes_travail;
CREATE TRIGGER trigger_sync_declarations
  AFTER INSERT OR UPDATE OR DELETE ON periodes_travail
  FOR EACH ROW
  EXECUTE FUNCTION sync_declarations_from_periods();
