ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'standard'
    CHECK (source IN ('standard', 'divers'));

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS divers_statut text
    CHECK (
      divers_statut IS NULL
      OR divers_statut IN ('en_attente', 'approuve', 'rejete')
    );

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS divers_reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS divers_reviewed_at timestamptz;

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS divers_rejection_reason text;

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS divers_creation_reason text;

ALTER TABLE public.chantiers
  DROP CONSTRAINT IF EXISTS chantiers_divers_fields_consistent;

ALTER TABLE public.chantiers
  ADD CONSTRAINT chantiers_divers_fields_consistent CHECK (
    (source = 'standard' AND divers_statut IS NULL)
    OR (
      source = 'divers'
      AND divers_statut IS NOT NULL
      AND created_by IS NOT NULL
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS chantiers_divers_nom_adresse_active_uidx
  ON public.chantiers (lower(trim(nom)), lower(trim(adresse)))
  WHERE source = 'divers' AND divers_statut IN ('en_attente', 'approuve');

ALTER TABLE public.chantiers REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.enforce_declaration_not_before_divers_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chantier public.chantiers%ROWTYPE;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.statut IS NOT DISTINCT FROM NEW.statut THEN
    RETURN NEW;
  END IF;

  IF NEW.statut NOT IN ('validee', 'rejetee') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_chantier FROM public.chantiers WHERE id = NEW.chantier_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_chantier.source = 'divers' AND v_chantier.divers_statut = 'en_attente' THEN
    RAISE EXCEPTION 'Impossible de valider les heures tant que le chantier divers n''est pas approuve';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_declaration_divers_approved ON public.declarations_heures;

CREATE TRIGGER trigger_enforce_declaration_divers_approved
  BEFORE UPDATE OF statut ON public.declarations_heures
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_declaration_not_before_divers_approved();
