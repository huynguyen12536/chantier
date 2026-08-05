/*
  Auto-approve a submitted declaration when it exactly matches the worker's
  latest previously validated shift.

  Flow:
  - Worker still submits as usual (declarations_heures.statut = 'soumise').
  - Right after submit, this trigger checks:
      1) current tuple has exactly one non-rejected period,
      2) worker has a previous validated period,
      3) chantier + hours + meal + travel are identical.
  - If matched, declaration is auto-switched to 'validee'.
  - Existing trigger sync_periods_from_declaration then propagates status to periodes_travail.
*/

CREATE OR REPLACE FUNCTION public.auto_approve_if_matches_latest_validated_shift()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count int;
  v_current_heure_debut time;
  v_current_heure_fin time;
  v_current_panier boolean;
  v_current_deplacement boolean;

  v_prev_chantier uuid;
  v_prev_heure_debut time;
  v_prev_heure_fin time;
  v_prev_panier boolean;
  v_prev_deplacement boolean;
BEGIN
  -- Only evaluate pending declarations.
  IF NEW.statut <> 'soumise' THEN
    RETURN NEW;
  END IF;

  -- Current declaration must represent exactly one active period.
  SELECT
    COUNT(*),
    MIN(p.heure_debut),
    MIN(p.heure_fin),
    BOOL_AND(COALESCE(p.panier_repas, false)),
    BOOL_AND(COALESCE(p.deplacement, false))
  INTO
    v_current_count,
    v_current_heure_debut,
    v_current_heure_fin,
    v_current_panier,
    v_current_deplacement
  FROM public.periodes_travail p
  WHERE p.user_id = NEW.user_id
    AND p.chantier_id = NEW.chantier_id
    AND p.date = NEW.date
    AND p.statut <> 'rejetee';

  IF v_current_count <> 1 OR v_current_heure_debut IS NULL OR v_current_heure_fin IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find latest previously validated period for this user.
  SELECT
    p.chantier_id,
    p.heure_debut,
    p.heure_fin,
    COALESCE(p.panier_repas, false),
    COALESCE(p.deplacement, false)
  INTO
    v_prev_chantier,
    v_prev_heure_debut,
    v_prev_heure_fin,
    v_prev_panier,
    v_prev_deplacement
  FROM public.periodes_travail p
  WHERE p.user_id = NEW.user_id
    AND p.statut = 'validee'
    AND (
      p.date < NEW.date
      OR (p.date = NEW.date AND (p.chantier_id <> NEW.chantier_id OR p.heure_debut <> v_current_heure_debut))
    )
  ORDER BY p.date DESC, p.heure_debut DESC
  LIMIT 1;

  IF v_prev_chantier IS NULL THEN
    RETURN NEW;
  END IF;

  -- Exact match required.
  IF v_prev_chantier = NEW.chantier_id
     AND v_prev_heure_debut = v_current_heure_debut
     AND v_prev_heure_fin = v_current_heure_fin
     AND v_prev_panier = COALESCE(v_current_panier, false)
     AND v_prev_deplacement = COALESCE(v_current_deplacement, false) THEN
    UPDATE public.declarations_heures
    SET
      statut = 'validee',
      validated_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.id
      AND statut = 'soumise';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_approve_matching_latest_validated_shift ON public.declarations_heures;

CREATE TRIGGER trigger_auto_approve_matching_latest_validated_shift
  AFTER INSERT OR UPDATE OF statut ON public.declarations_heures
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_if_matches_latest_validated_shift();
