
CREATE POLICY "Users can delete own rejected periods"
  ON periodes_travail FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND statut = 'rejetee');

CREATE POLICY "Users can delete own rejected declarations"
  ON declarations_heures FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND statut = 'rejetee');

CREATE OR REPLACE FUNCTION sync_declarations_from_periods()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
DECLARE
  v_user_id uuid; v_chantier uuid; v_date date; v_count int;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_chantier := COALESCE(NEW.chantier_id, OLD.chantier_id);
  v_date := COALESCE(NEW.date, OLD.date);
  SELECT COUNT(*) INTO v_count FROM periodes_travail
  WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date AND statut != 'rejetee';
  IF v_count = 0 THEN
    DELETE FROM declarations_heures WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date;
  ELSE
    INSERT INTO declarations_heures (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, updated_at)
    SELECT user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, NOW()
    FROM synthese_heures_journalieres
    WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date
    ON CONFLICT (user_id, chantier_id, date) DO UPDATE SET
      heures_normales = EXCLUDED.heures_normales, heures_supplementaires = EXCLUDED.heures_supplementaires,
      nb_paniers = EXCLUDED.nb_paniers, statut = EXCLUDED.statut, updated_at = NOW();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE POLICY "Users can update own rejected periods"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND statut = 'rejetee')
  WITH CHECK (user_id = auth.uid() AND statut = 'terminee');
