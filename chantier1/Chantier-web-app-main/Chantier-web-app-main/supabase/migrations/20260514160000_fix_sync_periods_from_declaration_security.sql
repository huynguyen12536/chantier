/*
  Run sync_periods_from_declaration as definer so periodes_travail
  updates succeed when a chef validates declarations_heures.
*/

CREATE OR REPLACE FUNCTION sync_periods_from_declaration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.statut IN ('validee', 'rejetee')
     AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    UPDATE periodes_travail
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
