/*
  # Add RLS policy for ouvriers to read zones_chantiers

  ## Problem
  Workers (ouvriers) are assigned to zones via zones_ouvriers but had no SELECT
  policy on zones_chantiers, preventing them from discovering which chantiers
  belong to their assigned zones.

  ## Changes
  - zones_chantiers: new SELECT policy allowing an ouvrier to read zone-chantier
    links for any zone they are actively assigned to (date_fin IS NULL)
*/

CREATE POLICY "Ouvrier can view chantiers in assigned zones"
  ON zones_chantiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_ouvriers zo
      WHERE zo.zone_id = zones_chantiers.zone_id
        AND zo.user_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );
