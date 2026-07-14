/*
  When a declaration is approved/rejected, propagate the status to
  periodes_travail so the worker timesheet receives realtime updates.
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

DROP TRIGGER IF EXISTS trigger_sync_periods_from_declaration ON declarations_heures;

CREATE TRIGGER trigger_sync_periods_from_declaration
  AFTER UPDATE OF statut, validated_by, validated_at ON declarations_heures
  FOR EACH ROW
  EXECUTE FUNCTION sync_periods_from_declaration();
