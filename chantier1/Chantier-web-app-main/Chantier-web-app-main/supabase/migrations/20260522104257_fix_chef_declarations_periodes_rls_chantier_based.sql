/*
  # Fix chef RLS policies for declarations_heures and periodes_travail

  ## Problem
  All chef-related SELECT/UPDATE/DELETE policies on declarations_heures and periodes_travail
  use `chef_equipe_id = auth.uid()` to check access. When a chantier has multiple chefs,
  workers are assigned to only one chef, so other co-chefs cannot see those declarations
  or periods, and the Validation page shows nothing.

  ## Fix
  Replace all chef policies to use the `get_chef_chantier_ids()` SECURITY DEFINER function
  (already created), which returns all chantier_ids where the chef is directly assigned
  as a user. This gives all co-chefs equal visibility into their shared chantiers.

  ## Tables affected
  - declarations_heures: SELECT, UPDATE, DELETE chef policies
  - periodes_travail: SELECT, UPDATE, DELETE chef policies
*/

-- ─── declarations_heures ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Chefs can view their team declarations" ON declarations_heures;
DROP POLICY IF EXISTS "Chefs can update team declarations for validation" ON declarations_heures;
DROP POLICY IF EXISTS "Chefs can delete team declarations" ON declarations_heures;

CREATE POLICY "Chefs can view their team declarations"
  ON declarations_heures
  FOR SELECT
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );

CREATE POLICY "Chefs can update team declarations for validation"
  ON declarations_heures
  FOR UPDATE
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  )
  WITH CHECK (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );

CREATE POLICY "Chefs can delete team declarations"
  ON declarations_heures
  FOR DELETE
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );

-- ─── periodes_travail ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Chefs can view their team periods" ON periodes_travail;
DROP POLICY IF EXISTS "Chefs can update team periods for validation" ON periodes_travail;
DROP POLICY IF EXISTS "Chefs can delete team periods" ON periodes_travail;

CREATE POLICY "Chefs can view their team periods"
  ON periodes_travail
  FOR SELECT
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );

CREATE POLICY "Chefs can update team periods for validation"
  ON periodes_travail
  FOR UPDATE
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
    AND statut = ANY (ARRAY['terminee', 'validee'])
  )
  WITH CHECK (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );

CREATE POLICY "Chefs can delete team periods"
  ON periodes_travail
  FOR DELETE
  TO authenticated
  USING (
    chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
    OR EXISTS (
      SELECT 1
      FROM zones_ouvriers zo
      JOIN zones_equipe ze ON ze.id = zo.zone_id
      WHERE zo.user_id = periodes_travail.user_id
        AND ze.chef_equipe_id = auth.uid()
        AND zo.date_fin IS NULL
    )
  );
