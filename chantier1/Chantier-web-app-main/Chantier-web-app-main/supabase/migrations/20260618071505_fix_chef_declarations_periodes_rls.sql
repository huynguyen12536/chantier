
CREATE OR REPLACE FUNCTION get_chef_chantier_ids(chef_id uuid)
RETURNS TABLE(chantier_id uuid)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT DISTINCT ac.chantier_id FROM affectations_chantiers ac WHERE ac.user_id = chef_id AND ac.date_fin IS NULL;
$$;

DROP POLICY IF EXISTS "Chefs can view their team declarations" ON declarations_heures;
DROP POLICY IF EXISTS "Chefs can update team declarations for validation" ON declarations_heures;
DROP POLICY IF EXISTS "Chefs can delete team declarations" ON declarations_heures;

CREATE POLICY "Chefs can view their team declarations"
  ON declarations_heures FOR SELECT TO authenticated
  USING (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c));

CREATE POLICY "Chefs can update team declarations for validation"
  ON declarations_heures FOR UPDATE TO authenticated
  USING (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c))
  WITH CHECK (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c));

CREATE POLICY "Chefs can delete team declarations"
  ON declarations_heures FOR DELETE TO authenticated
  USING (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c));

DROP POLICY IF EXISTS "Chefs can view their team periods" ON periodes_travail;
DROP POLICY IF EXISTS "Chefs can update team periods for validation" ON periodes_travail;
DROP POLICY IF EXISTS "Chefs can delete team periods" ON periodes_travail;

CREATE POLICY "Chefs can view their team periods"
  ON periodes_travail FOR SELECT TO authenticated
  USING (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c));

CREATE POLICY "Chefs can update team periods for validation"
  ON periodes_travail FOR UPDATE TO authenticated
  USING (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c) AND statut = ANY (ARRAY['terminee', 'validee']))
  WITH CHECK (chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c));

CREATE POLICY "Chefs can delete team periods"
  ON periodes_travail FOR DELETE TO authenticated
  USING (
    chantier_id IN (SELECT c.chantier_id FROM get_chef_chantier_ids(auth.uid()) c)
    OR EXISTS (SELECT 1 FROM zones_ouvriers zo JOIN zones_equipe ze ON ze.id = zo.zone_id WHERE zo.user_id = periodes_travail.user_id AND ze.chef_equipe_id = auth.uid() AND zo.date_fin IS NULL)
  );
