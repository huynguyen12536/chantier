-- Collaborator absence declarations (date ranges, no approval workflow).

CREATE TABLE IF NOT EXISTS public.absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  motif text,
  commentaire text CHECK (commentaire IS NULL OR char_length(commentaire) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT absences_date_range CHECK (date_fin >= date_debut)
);

CREATE INDEX IF NOT EXISTS absences_user_dates_idx
  ON public.absences (user_id, date_debut, date_fin);

CREATE OR REPLACE FUNCTION public.set_absences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS absences_set_updated_at ON public.absences;
CREATE TRIGGER absences_set_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_absences_updated_at();

-- Chef can read absences for users on managed chantiers or zones.
CREATE OR REPLACE FUNCTION public.can_view_user_absence(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = p_target_user_id
      OR EXISTS (
        SELECT 1 FROM public.profiles viewer
        WHERE viewer.id = auth.uid()
          AND viewer.role IN ('admin', 'administratif')
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles viewer
        WHERE viewer.id = auth.uid()
          AND viewer.role = 'chef_equipe'
          AND (
            EXISTS (
              SELECT 1
              FROM public.affectations_chantiers ac_target
              JOIN public.affectations_chantiers ac_chef
                ON ac_chef.chantier_id = ac_target.chantier_id
              WHERE ac_target.user_id = p_target_user_id
                AND ac_chef.user_id = auth.uid()
                AND ac_target.date_fin IS NULL
                AND ac_chef.date_fin IS NULL
            )
            OR EXISTS (
              SELECT 1
              FROM public.zones_equipe ze
              JOIN public.zones_ouvriers zo ON zo.zone_id = ze.id
              WHERE ze.chef_equipe_id = auth.uid()
                AND zo.user_id = p_target_user_id
                AND zo.date_fin IS NULL
            )
          )
      )
    );
$$;

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS absences_select ON public.absences;
CREATE POLICY absences_select ON public.absences
  FOR SELECT
  USING (public.can_view_user_absence(user_id));

DROP POLICY IF EXISTS absences_insert ON public.absences;
CREATE POLICY absences_insert ON public.absences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS absences_update ON public.absences;
CREATE POLICY absences_update ON public.absences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS absences_delete ON public.absences;
CREATE POLICY absences_delete ON public.absences
  FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
