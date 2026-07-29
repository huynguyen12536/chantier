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

ALTER TABLE public.absences REPLICA IDENTITY FULL;
