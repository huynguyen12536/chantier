-- Index used by the 4-month Divers cleanup job (app-side scheduler, no pg_cron).
CREATE INDEX IF NOT EXISTS chantiers_divers_created_at_idx
  ON public.chantiers (created_at)
  WHERE source = 'divers';
