ALTER TABLE public.periodes_travail
  DROP CONSTRAINT IF EXISTS periodes_travail_heure_fin_after_debut;

ALTER TABLE public.periodes_travail
  ADD CONSTRAINT periodes_travail_heure_fin_after_debut
  CHECK (heure_fin IS NULL OR heure_fin > heure_debut)
  NOT VALID;

ALTER TABLE public.periodes_travail
  VALIDATE CONSTRAINT periodes_travail_heure_fin_after_debut;

CREATE OR REPLACE FUNCTION public.enforce_periodes_travail_shift_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.heure_fin IS NOT NULL AND NEW.heure_fin <= NEW.heure_debut THEN
    RAISE EXCEPTION 'periodes_travail_invalid_hours: end time must be after start time'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.heure_fin IS NULL OR NEW.statut = 'annulee' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.declarations_heures d
    WHERE d.user_id = NEW.user_id
      AND d.chantier_id = NEW.chantier_id
      AND d.date = NEW.date
      AND d.statut = 'annulee'
  ) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.periodes_travail p
    WHERE p.user_id = NEW.user_id
      AND p.date = NEW.date
      AND p.id IS DISTINCT FROM NEW.id
      AND COALESCE(p.statut, '') <> 'annulee'
      AND p.heure_debut IS NOT NULL
      AND p.heure_fin IS NOT NULL
      AND NEW.heure_debut < p.heure_fin
      AND p.heure_debut < NEW.heure_fin
      AND NOT EXISTS (
        SELECT 1
        FROM public.declarations_heures d
        WHERE d.user_id = p.user_id
          AND d.chantier_id = p.chantier_id
          AND d.date = p.date
          AND d.statut = 'annulee'
      )
  ) THEN
    RAISE EXCEPTION 'periodes_travail_overlap: shift overlaps another period on the same day'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_periodes_travail_shift_rules ON public.periodes_travail;

CREATE TRIGGER trigger_enforce_periodes_travail_shift_rules
  BEFORE INSERT OR UPDATE OF heure_debut, heure_fin, date, user_id, statut, chantier_id
  ON public.periodes_travail
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_periodes_travail_shift_rules();
