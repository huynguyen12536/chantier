/*
  Collaborator divers notification feed + replica identity for chantier review events.
  Authorization is enforced in the Unified API (RPC handler), not RLS/auth.uid().
*/

ALTER TABLE public.declarations_heures REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.get_collaborator_divers_notifications(
  p_user_id uuid,
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
        AND d.user_id = p_user_id
        AND d.statut = 'annulee'
        AND d.updated_at >= p_since
    ) AS cancelled_shifts_count
  FROM chantiers c
  WHERE c.created_by = p_user_id
    AND c.source = 'divers'
    AND c.divers_statut IN ('approuve', 'rejete')
    AND c.divers_reviewed_at IS NOT NULL
    AND c.divers_reviewed_at >= p_since
  ORDER BY c.divers_reviewed_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.get_collaborator_divers_notifications(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_collaborator_divers_notifications(uuid, timestamptz) TO PUBLIC;
