/*
  # Admin full access on zones tables

  ## Changes
  - zones_equipe: admin can SELECT, INSERT, UPDATE, DELETE any zone
  - zones_chantiers: admin can SELECT, INSERT, DELETE any zone-chantier link
  - zones_ouvriers: admin can SELECT, INSERT, UPDATE, DELETE any zone-ouvrier link

  This lets the admin screen read all zones and link chantiers to zones when
  creating or editing a chantier.
*/

-- Helper: is the calling user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── zones_equipe ─────────────────────────────────────────────────────────────
CREATE POLICY "Admin can view all zones"
  ON zones_equipe FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert zones"
  ON zones_equipe FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update zones"
  ON zones_equipe FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete zones"
  ON zones_equipe FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── zones_chantiers ──────────────────────────────────────────────────────────
CREATE POLICY "Admin can view all zone chantiers"
  ON zones_chantiers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert zone chantiers"
  ON zones_chantiers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete zone chantiers"
  ON zones_chantiers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── zones_ouvriers ───────────────────────────────────────────────────────────
CREATE POLICY "Admin can view all zone ouvriers"
  ON zones_ouvriers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert zone ouvriers"
  ON zones_ouvriers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update zone ouvriers"
  ON zones_ouvriers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete zone ouvriers"
  ON zones_ouvriers FOR DELETE
  TO authenticated
  USING (public.is_admin());
