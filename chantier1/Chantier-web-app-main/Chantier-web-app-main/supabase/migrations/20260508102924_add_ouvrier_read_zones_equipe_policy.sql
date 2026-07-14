/*
  # Add ouvrier read policy on zones_equipe

  Allows ouvriers to see zones they are actively assigned to.
  This policy is added after zones_ouvriers exists.
*/

CREATE POLICY "Ouvrier can view assigned zones"
  ON zones_equipe FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_ouvriers zo
      WHERE zo.zone_id = zones_equipe.id
        AND zo.user_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );
