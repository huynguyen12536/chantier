-- Per-tenant unique worksite names (adapted from upstream global uniqueness).
-- Historical duplicates in other tenants are preserved; new/renamed names are unique within company.

CREATE OR REPLACE FUNCTION public.normalize_chantier_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(regexp_replace(btrim(coalesce(p_name, '')), '[[:space:]]+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.enforce_unique_chantier_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_normalized_name text;
BEGIN
  NEW.nom := regexp_replace(btrim(NEW.nom), '[[:space:]]+', ' ', 'g');
  v_normalized_name := public.normalize_chantier_name(NEW.nom);

  IF v_normalized_name = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'chantier_name_required';
  END IF;

  IF TG_OP = 'UPDATE'
     AND public.normalize_chantier_name(OLD.nom) = v_normalized_name
     AND OLD.company_id IS NOT DISTINCT FROM NEW.company_id THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(NEW.company_id::text, '') || ':' || v_normalized_name, 0));

  IF EXISTS (
    SELECT 1
    FROM public.chantiers AS chantier
    WHERE public.normalize_chantier_name(chantier.nom) = v_normalized_name
      AND chantier.company_id IS NOT DISTINCT FROM NEW.company_id
      AND (TG_OP = 'INSERT' OR chantier.id <> NEW.id)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'chantier_name_already_exists',
      DETAIL = 'A worksite with the same normalized name already exists in this company.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_unique_chantier_name_trigger ON public.chantiers;

CREATE TRIGGER enforce_unique_chantier_name_trigger
BEFORE INSERT OR UPDATE OF nom ON public.chantiers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unique_chantier_name();
