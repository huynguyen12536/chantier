
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "Admin can view all zones" ON zones_equipe FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert zones" ON zones_equipe FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update zones" ON zones_equipe FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete zones" ON zones_equipe FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin can view all zone chantiers" ON zones_chantiers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert zone chantiers" ON zones_chantiers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete zone chantiers" ON zones_chantiers FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin can view all zone ouvriers" ON zones_ouvriers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert zone ouvriers" ON zones_ouvriers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update zone ouvriers" ON zones_ouvriers FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete zone ouvriers" ON zones_ouvriers FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION delete_chantier_cascade(p_chantier_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'administratif') THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;
  DELETE FROM periodes_travail WHERE chantier_id = p_chantier_id;
  DELETE FROM declarations_heures WHERE chantier_id = p_chantier_id;
  DELETE FROM zones_chantiers WHERE chantier_id = p_chantier_id;
  DELETE FROM affectations_chantiers WHERE chantier_id = p_chantier_id;
  DELETE FROM chantiers WHERE id = p_chantier_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_chantier_cascade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_chantier_cascade(uuid) TO authenticated;
