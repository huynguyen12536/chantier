/*
  # Fix infinite recursion in chef affectations RLS policy

  ## Problem
  The policy "Chefs can view all affectations in their chantiers" caused infinite recursion
  because it queried affectations_chantiers inside the policy for affectations_chantiers itself.

  ## Fix
  Create a SECURITY DEFINER function that bypasses RLS to get the list of chantier_ids
  for a given chef, then use that function in the policy to avoid self-referencing.
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Chefs can view all affectations in their chantiers" ON affectations_chantiers;

-- Create a security definer helper that reads affectations without triggering RLS
CREATE OR REPLACE FUNCTION get_chef_chantier_ids(chef_id uuid)
RETURNS TABLE(chantier_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ac.chantier_id
  FROM affectations_chantiers ac
  WHERE ac.user_id = chef_id
    AND ac.date_fin IS NULL;
$$;

-- Recreate the policy using the helper function (no recursion)
CREATE POLICY "Chefs can view all affectations in their chantiers"
  ON affectations_chantiers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'chef_equipe'
    )
    AND
    affectations_chantiers.chantier_id IN (
      SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c
    )
  );
