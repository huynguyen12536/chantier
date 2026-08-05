/*
  Fix collaborator notifications for rejected/approved divers chantiers.

  Ouvriers could not SELECT their own rejected divers rows (RLS excluded rejete),
  so rejection notifications never loaded and chantiers realtime did not deliver.
*/

-- Creators can read their own reviewed divers chantiers (notification feed / history).
DROP POLICY IF EXISTS "Creators can read own reviewed divers chantiers" ON public.chantiers;
CREATE POLICY "Creators can read own reviewed divers chantiers"
  ON public.chantiers
  FOR SELECT
  TO authenticated
  USING (
    source = 'divers'
    AND created_by = auth.uid()
    AND divers_statut IN ('approuve', 'rejete')
  );

-- Realtime for chantier review + declaration cancellations.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'chantiers'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chantiers;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'declarations_heures'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.declarations_heures;
    END IF;
  END IF;
END $$;

ALTER TABLE public.chantiers REPLICA IDENTITY FULL;
ALTER TABLE public.declarations_heures REPLICA IDENTITY FULL;

-- Security-definer feed so notifications work even if RLS policies evolve.
CREATE OR REPLACE FUNCTION public.get_collaborator_divers_notifications(
  p_since timestamptz DEFAULT (now() - interval '14 days')
)
RETURNS TABLE (
  chantier_id uuid,
  nom text,
  divers_statut text,
  divers_reviewed_at timestamptz,
  divers_rejection_reason text,
  cancelled_shifts_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id AS chantier_id,
    c.nom,
    c.divers_statut,
    c.divers_reviewed_at,
    c.divers_rejection_reason,
    (
      SELECT count(*)::bigint
      FROM declarations_heures d
      WHERE d.chantier_id = c.id
        AND d.user_id = auth.uid()
        AND d.statut = 'annulee'
        AND d.updated_at >= p_since
    ) AS cancelled_shifts_count
  FROM chantiers c
  WHERE c.created_by = auth.uid()
    AND c.source = 'divers'
    AND c.divers_statut IN ('approuve', 'rejete')
    AND c.divers_reviewed_at IS NOT NULL
    AND c.divers_reviewed_at >= p_since
  ORDER BY c.divers_reviewed_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.get_collaborator_divers_notifications(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_collaborator_divers_notifications(timestamptz) TO authenticated;
