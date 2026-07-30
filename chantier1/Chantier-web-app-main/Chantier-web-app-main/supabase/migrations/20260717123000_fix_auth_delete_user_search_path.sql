/*
  Fix auth.admin.deleteUser failing with:
    42P01 relation "periodes_travail" does not exist

  The table exists in public, but GoTrue deletes users with a search_path that
  does not include public. Triggers on periodes_travail / declarations_heures
  then resolve unqualified names as missing.

  Qualify public.* and force search_path = public on sync functions.
*/

CREATE OR REPLACE FUNCTION public.sync_declarations_from_periods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_chantier   uuid;
  v_date       date;
  v_count      int;
BEGIN
  v_user_id  := COALESCE(NEW.user_id, OLD.user_id);
  v_chantier := COALESCE(NEW.chantier_id, OLD.chantier_id);
  v_date     := COALESCE(NEW.date, OLD.date);

  SELECT COUNT(*) INTO v_count
  FROM public.periodes_travail
  WHERE user_id = v_user_id
    AND chantier_id = v_chantier
    AND date = v_date
    AND statut != 'rejetee';

  IF v_count = 0 THEN
    UPDATE public.declarations_heures
    SET
      statut = CASE
        WHEN statut = 'soumise' THEN 'annulee'
        ELSE statut
      END,
      validated_by = CASE
        WHEN statut = 'soumise' THEN auth.uid()
        ELSE validated_by
      END,
      validated_at = CASE
        WHEN statut = 'soumise' THEN NOW()
        ELSE validated_at
      END,
      updated_at = NOW()
    WHERE user_id = v_user_id
      AND chantier_id = v_chantier
      AND date = v_date;

    DELETE FROM public.declarations_heures
    WHERE user_id = v_user_id
      AND chantier_id = v_chantier
      AND date = v_date
      AND statut NOT IN ('annulee', 'validee', 'rejetee');
  ELSE
    INSERT INTO public.declarations_heures (
      user_id,
      chantier_id,
      date,
      heures_normales,
      heures_supplementaires,
      nb_paniers,
      statut,
      updated_at
    )
    SELECT
      user_id,
      chantier_id,
      date,
      heures_normales,
      heures_supplementaires,
      nb_paniers,
      statut,
      NOW()
    FROM public.synthese_heures_journalieres
    WHERE user_id = v_user_id
      AND chantier_id = v_chantier
      AND date = v_date
    ON CONFLICT (user_id, chantier_id, date)
    DO UPDATE SET
      heures_normales = EXCLUDED.heures_normales,
      heures_supplementaires = EXCLUDED.heures_supplementaires,
      nb_paniers = EXCLUDED.nb_paniers,
      statut = EXCLUDED.statut,
      updated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_periods_from_declaration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut IN ('validee', 'rejetee')
     AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    UPDATE public.periodes_travail
    SET
      statut = NEW.statut,
      validated_by = NEW.validated_by,
      validated_at = NEW.validated_at,
      updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND chantier_id = NEW.chantier_id
      AND date = NEW.date
      AND statut IN ('terminee', 'en_cours');
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure triggers still point at the fixed functions
DROP TRIGGER IF EXISTS trigger_sync_declarations ON public.periodes_travail;
CREATE TRIGGER trigger_sync_declarations
  AFTER INSERT OR UPDATE OR DELETE ON public.periodes_travail
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_declarations_from_periods();

DROP TRIGGER IF EXISTS trigger_sync_periods_from_declaration ON public.declarations_heures;
CREATE TRIGGER trigger_sync_periods_from_declaration
  AFTER UPDATE OF statut, validated_by, validated_at ON public.declarations_heures
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_periods_from_declaration();
