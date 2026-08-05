/*
  # Fix chef_equipe RLS: allow viewing all affectations in shared chantiers

  ## Problem
  The existing RLS policy "Chefs can view their team affectations" only allows a chef to see
  affectations where chef_equipe_id = auth.uid(). When a chantier has multiple chefs, workers
  are assigned to one specific chef (the first one picked by the algorithm), so other chefs
  cannot see those workers even though they are co-managers of the same chantier.

  ## Fix
  Replace the restrictive policy with one that allows a chef to view ALL affectations in any
  chantier where the chef themselves has an active affectation (i.e., chantiers they participate in).
  This ensures that all co-chefs of a chantier see the same team.

  ## Changes
  - DROP old "Chefs can view their team affectations" policy on affectations_chantiers
  - ADD new "Chefs can view all affectations in their chantiers" policy using a subquery
    that checks whether the chef is assigned to the same chantier
*/

-- Drop the old restrictive policy that used chef_equipe_id = auth.uid()
DROP POLICY IF EXISTS "Chefs can view their team affectations" ON affectations_chantiers;

-- New policy: chef can see all affectations for any chantier they are assigned to
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
    EXISTS (
      SELECT 1
      FROM affectations_chantiers my_aff
      WHERE my_aff.user_id = auth.uid()
        AND my_aff.chantier_id = affectations_chantiers.chantier_id
        AND my_aff.date_fin IS NULL
    )
  );
