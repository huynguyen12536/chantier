/*
  # Fix: ouvrier can resubmit (UPDATE) their own rejected periods

  The existing UPDATE policy only allows statut IN ('en_cours', 'terminee').
  A rejected period has statut='rejetee', so the ouvrier cannot edit and
  resubmit it. This policy fixes that gap.
*/

CREATE POLICY "Users can update own rejected periods"
  ON periodes_travail FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND statut = 'rejetee'
  )
  WITH CHECK (
    user_id = auth.uid()
  );
