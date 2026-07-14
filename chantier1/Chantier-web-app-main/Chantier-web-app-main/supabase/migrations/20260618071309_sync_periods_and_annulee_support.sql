
CREATE OR REPLACE FUNCTION sync_periods_from_declaration()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.statut IN ('validee', 'rejetee') AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    UPDATE periodes_travail SET statut = NEW.statut, validated_by = NEW.validated_by, validated_at = NEW.validated_at, updated_at = NOW()
    WHERE user_id = NEW.user_id AND chantier_id = NEW.chantier_id AND date = NEW.date AND statut IN ('terminee', 'en_cours');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_periods_from_declaration ON declarations_heures;
CREATE TRIGGER trigger_sync_periods_from_declaration
  AFTER UPDATE OF statut, validated_by, validated_at ON declarations_heures
  FOR EACH ROW EXECUTE FUNCTION sync_periods_from_declaration();

-- Annulee support
ALTER TABLE public.declarations_heures DROP CONSTRAINT IF EXISTS declarations_heures_statut_check;
ALTER TABLE public.declarations_heures ADD CONSTRAINT declarations_heures_statut_check
  CHECK (statut IN ('brouillon', 'soumise', 'validee', 'rejetee', 'annulee'));

-- Updated sync function with annulee support
CREATE OR REPLACE FUNCTION public.sync_declarations_from_periods()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid; v_chantier uuid; v_date date; v_count int;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_chantier := COALESCE(NEW.chantier_id, OLD.chantier_id);
  v_date := COALESCE(NEW.date, OLD.date);
  SELECT COUNT(*) INTO v_count FROM periodes_travail
  WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date AND statut != 'rejetee';
  IF v_count = 0 THEN
    UPDATE declarations_heures SET
      statut = CASE WHEN statut = 'soumise' THEN 'annulee' ELSE statut END,
      validated_by = CASE WHEN statut = 'soumise' THEN auth.uid() ELSE validated_by END,
      validated_at = CASE WHEN statut = 'soumise' THEN NOW() ELSE validated_at END,
      updated_at = NOW()
    WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date;
    DELETE FROM declarations_heures WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date AND statut NOT IN ('annulee', 'validee', 'rejetee');
  ELSE
    INSERT INTO declarations_heures (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, updated_at)
    SELECT user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut, NOW()
    FROM synthese_heures_journalieres WHERE user_id = v_user_id AND chantier_id = v_chantier AND date = v_date
    ON CONFLICT (user_id, chantier_id, date) DO UPDATE SET
      heures_normales = EXCLUDED.heures_normales, heures_supplementaires = EXCLUDED.heures_supplementaires,
      nb_paniers = EXCLUDED.nb_paniers, statut = EXCLUDED.statut, updated_at = NOW();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
