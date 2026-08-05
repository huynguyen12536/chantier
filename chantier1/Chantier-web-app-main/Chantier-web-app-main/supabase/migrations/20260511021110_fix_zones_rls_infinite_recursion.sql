
/*
  # Fix RLS infinite recursion on zones tables

  ## Problem
  - zones_equipe SELECT policy checks zones_ouvriers
  - zones_ouvriers SELECT policy checks zones_equipe
  - This creates infinite recursion when Postgres evaluates policies

  ## Solution
  1. Create a SECURITY DEFINER helper function to check zone ownership
     (bypasses RLS, so no recursion)
  2. Drop all existing policies on zones_equipe, zones_chantiers, zones_ouvriers
  3. Recreate policies using the helper function instead of cross-table EXISTS subqueries
*/

-- Helper: returns true if the given zone belongs to the calling user
CREATE OR REPLACE FUNCTION public.is_zone_owner(p_zone_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM zones_equipe
    WHERE id = p_zone_id
      AND chef_equipe_id = auth.uid()
  );
$$;

-- ── Drop existing policies ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Chef can view own zones"          ON zones_equipe;
DROP POLICY IF EXISTS "Chef can insert own zones"        ON zones_equipe;
DROP POLICY IF EXISTS "Chef can update own zones"        ON zones_equipe;
DROP POLICY IF EXISTS "Chef can delete own zones"        ON zones_equipe;
DROP POLICY IF EXISTS "Ouvrier can view assigned zones"  ON zones_equipe;

DROP POLICY IF EXISTS "Chef can view zone chantiers"    ON zones_chantiers;
DROP POLICY IF EXISTS "Chef can insert zone chantiers"  ON zones_chantiers;
DROP POLICY IF EXISTS "Chef can delete zone chantiers"  ON zones_chantiers;

DROP POLICY IF EXISTS "Chef can view zone ouvriers"          ON zones_ouvriers;
DROP POLICY IF EXISTS "Chef can insert zone ouvriers"        ON zones_ouvriers;
DROP POLICY IF EXISTS "Chef can update zone ouvriers"        ON zones_ouvriers;
DROP POLICY IF EXISTS "Chef can delete zone ouvriers"        ON zones_ouvriers;
DROP POLICY IF EXISTS "Ouvrier can view own zone assignments" ON zones_ouvriers;

-- ── zones_equipe policies ───────────────────────────────────────────────────

CREATE POLICY "Chef can view own zones"
  ON zones_equipe FOR SELECT
  TO authenticated
  USING (chef_equipe_id = auth.uid());

-- Ouvrier sees zones they are assigned to — use direct join, no cross-policy recursion
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

-- ── zones_chantiers policies ────────────────────────────────────────────────
-- Use the SECURITY DEFINER function to avoid recursion

CREATE POLICY "Chef can view zone chantiers"
  ON zones_chantiers FOR SELECT
  TO authenticated
  USING (public.is_zone_owner(zone_id));

CREATE POLICY "Chef can insert zone chantiers"
  ON zones_chantiers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_zone_owner(zone_id));

CREATE POLICY "Chef can delete zone chantiers"
  ON zones_chantiers FOR DELETE
  TO authenticated
  USING (public.is_zone_owner(zone_id));

-- ── zones_ouvriers policies ─────────────────────────────────────────────────
-- Use the SECURITY DEFINER function to avoid recursion

CREATE POLICY "Chef can view zone ouvriers"
  ON zones_ouvriers FOR SELECT
  TO authenticated
  USING (public.is_zone_owner(zone_id));

CREATE POLICY "Ouvrier can view own zone assignments"
  ON zones_ouvriers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chef can insert zone ouvriers"
  ON zones_ouvriers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_zone_owner(zone_id));

CREATE POLICY "Chef can update zone ouvriers"
  ON zones_ouvriers FOR UPDATE
  TO authenticated
  USING (public.is_zone_owner(zone_id))
  WITH CHECK (public.is_zone_owner(zone_id));

CREATE POLICY "Chef can delete zone ouvriers"
  ON zones_ouvriers FOR DELETE
  TO authenticated
  USING (public.is_zone_owner(zone_id));
