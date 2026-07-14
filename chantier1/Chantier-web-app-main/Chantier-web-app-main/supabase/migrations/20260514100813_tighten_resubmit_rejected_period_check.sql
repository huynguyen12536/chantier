/*
  # Tighten WITH CHECK on rejected period resubmit policy

  Replace the broad WITH CHECK so ouvrier can only change a rejected period
  back to 'terminee' (resubmit), not to any arbitrary status.
*/

DROP POLICY IF EXISTS "Users can update own rejected periods" ON periodes_travail;

CREATE POLICY "Users can update own rejected periods"
  ON periodes_travail FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND statut = 'rejetee'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND statut = 'terminee'
  );
