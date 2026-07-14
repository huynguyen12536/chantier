/*
  # Create zones_equipe, zones_chantiers, zones_ouvriers tables

  Introduces a zone concept so a chef d'équipe can group multiple chantiers into
  a named zone and assign ouvriers to that zone.

  Tables:
  - zones_equipe: zones owned by a chef_equipe
  - zones_chantiers: chantiers linked to a zone
  - zones_ouvriers: ouvriers assigned to a zone with date range
*/

CREATE TABLE IF NOT EXISTS zones_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_equipe_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones_equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef can view own zones"
  ON zones_equipe FOR SELECT
  TO authenticated
  USING (chef_equipe_id = auth.uid());

CREATE POLICY "Chef can insert own zones"
  ON zones_equipe FOR INSERT
  TO authenticated
  WITH CHECK (chef_equipe_id = auth.uid());

CREATE POLICY "Chef can update own zones"
  ON zones_equipe FOR UPDATE
  TO authenticated
  USING (chef_equipe_id = auth.uid())
  WITH CHECK (chef_equipe_id = auth.uid());

CREATE POLICY "Chef can delete own zones"
  ON zones_equipe FOR DELETE
  TO authenticated
  USING (chef_equipe_id = auth.uid());

---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS zones_chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES zones_equipe(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (zone_id, chantier_id)
);

ALTER TABLE zones_chantiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef can view zone chantiers"
  ON zones_chantiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_chantiers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Chef can insert zone chantiers"
  ON zones_chantiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_chantiers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Chef can delete zone chantiers"
  ON zones_chantiers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_chantiers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS zones_ouvriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES zones_equipe(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones_ouvriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef can view zone ouvriers"
  ON zones_ouvriers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_ouvriers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Chef can insert zone ouvriers"
  ON zones_ouvriers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_ouvriers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Chef can update zone ouvriers"
  ON zones_ouvriers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_ouvriers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_ouvriers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Chef can delete zone ouvriers"
  ON zones_ouvriers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zones_equipe ze
      WHERE ze.id = zones_ouvriers.zone_id
        AND ze.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Ouvrier can view own zone assignments"
  ON zones_ouvriers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
