-- Per-tenant uniqueness for active divers chantiers (nom + adresse).
-- Replaces global index that blocked same nom/adresse across companies.

DROP INDEX IF EXISTS public.chantiers_divers_nom_adresse_active_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS chantiers_divers_company_nom_adresse_active_uidx
  ON public.chantiers (company_id, lower(trim(nom)), lower(trim(adresse)))
  WHERE source = 'divers' AND divers_statut IN ('en_attente', 'approuve');
