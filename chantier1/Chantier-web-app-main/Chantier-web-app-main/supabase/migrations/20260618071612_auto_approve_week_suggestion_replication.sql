
CREATE OR REPLACE FUNCTION public.auto_approve_week_suggestion_replication(p_plans jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid; v_group record; v_plan jsonb; v_plan_count int;
  v_target_period_count int; v_all_sources_ok boolean; v_all_targets_ok boolean;
  v_row_count int; v_approved_count int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_plans IS NULL OR jsonb_typeof(p_plans) <> 'array' OR jsonb_array_length(p_plans) = 0 THEN RETURN 0; END IF;
  FOR v_group IN
    SELECT (elem->>'target_date')::date AS target_date, (elem->>'chantier_id')::uuid AS chantier_id, jsonb_agg(elem) AS plans
    FROM jsonb_array_elements(p_plans) AS elem GROUP BY 1, 2
  LOOP
    v_plan_count := jsonb_array_length(v_group.plans);
    SELECT COUNT(*)::int INTO v_target_period_count FROM public.periodes_travail p
    WHERE p.user_id = v_user_id AND p.date = v_group.target_date AND p.chantier_id = v_group.chantier_id AND p.statut NOT IN ('rejetee', 'annulee');
    IF v_target_period_count <> v_plan_count THEN CONTINUE; END IF;
    v_all_sources_ok := true; v_all_targets_ok := true;
    FOR v_plan IN SELECT value FROM jsonb_array_elements(v_group.plans) AS t(value) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.periodes_travail p WHERE p.user_id = v_user_id AND p.date = (v_plan->>'source_date')::date AND p.chantier_id = (v_plan->>'chantier_id')::uuid AND p.statut = 'validee' AND p.heure_debut = (v_plan->>'heure_debut')::time AND p.heure_fin = (v_plan->>'heure_fin')::time AND COALESCE(p.panier_repas, false) = COALESCE((v_plan->>'panier_repas')::boolean, false) AND COALESCE(p.deplacement, false) = COALESCE((v_plan->>'deplacement')::boolean, false)) THEN
        v_all_sources_ok := false; EXIT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.periodes_travail p WHERE p.user_id = v_user_id AND p.date = (v_plan->>'target_date')::date AND p.chantier_id = (v_plan->>'chantier_id')::uuid AND p.statut NOT IN ('rejetee', 'annulee') AND p.heure_debut = (v_plan->>'heure_debut')::time AND p.heure_fin = (v_plan->>'heure_fin')::time AND COALESCE(p.panier_repas, false) = COALESCE((v_plan->>'panier_repas')::boolean, false) AND COALESCE(p.deplacement, false) = COALESCE((v_plan->>'deplacement')::boolean, false)) THEN
        v_all_targets_ok := false; EXIT;
      END IF;
    END LOOP;
    IF NOT v_all_sources_ok OR NOT v_all_targets_ok THEN CONTINUE; END IF;
    UPDATE public.declarations_heures SET statut = 'validee', validated_at = NOW(), updated_at = NOW()
    WHERE user_id = v_user_id AND chantier_id = v_group.chantier_id AND date = v_group.target_date AND statut = 'soumise';
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count > 0 THEN v_approved_count := v_approved_count + 1; END IF;
  END LOOP;
  RETURN v_approved_count;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_approve_week_suggestion_replication(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_approve_week_suggestion_replication(jsonb) TO authenticated;
