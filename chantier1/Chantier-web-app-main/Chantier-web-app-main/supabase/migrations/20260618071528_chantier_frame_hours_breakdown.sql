
CREATE OR REPLACE FUNCTION minutes_from_time(t time)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT (EXTRACT(HOUR FROM t)::int * 60 + EXTRACT(MINUTE FROM t)::int);
$$;

CREATE OR REPLACE FUNCTION calculer_heures_cadre_chantier(
  travail_debut time, travail_fin time, cadre_debut time, cadre_fin time
)
RETURNS TABLE (heures_normales decimal(6,2), heures_supplementaires decimal(6,2), total_heures decimal(6,2))
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  w0 int; w1 int; c0 int; c1 int; norm_min int; supp_min int; total_min int; total_dec decimal(6,2);
BEGIN
  IF travail_fin IS NULL OR travail_fin <= travail_debut THEN
    heures_normales := 0; heures_supplementaires := 0; total_heures := 0; RETURN NEXT; RETURN;
  END IF;
  w0 := minutes_from_time(travail_debut); w1 := minutes_from_time(travail_fin);
  total_min := w1 - w0; total_dec := ROUND((total_min::decimal / 60), 2);
  IF cadre_debut IS NULL OR cadre_fin IS NULL OR cadre_fin <= cadre_debut THEN
    heures_normales := LEAST(total_dec, 7.0); heures_supplementaires := GREATEST(total_dec - 7.0, 0.0); total_heures := total_dec; RETURN NEXT; RETURN;
  END IF;
  c0 := minutes_from_time(cadre_debut); c1 := minutes_from_time(cadre_fin);
  norm_min := GREATEST(0, LEAST(w1, c1) - GREATEST(w0, c0));
  supp_min := CASE WHEN w1 > c1 THEN w1 - GREATEST(w0, c1) ELSE 0 END;
  heures_normales := ROUND((norm_min::decimal / 60), 2); heures_supplementaires := ROUND((supp_min::decimal / 60), 2); total_heures := total_dec;
  RETURN NEXT;
END;
$$;

DROP VIEW IF EXISTS synthese_heures_journalieres CASCADE;

CREATE VIEW synthese_heures_journalieres AS
SELECT
  pt.user_id, pt.chantier_id, pt.date,
  ROUND(SUM(h.total_heures)::numeric, 2) AS total_heures,
  ROUND(SUM(h.heures_normales)::numeric, 2) AS heures_normales,
  ROUND(SUM(h.heures_supplementaires)::numeric, 2) AS heures_supplementaires,
  SUM(CASE WHEN pt.panier_repas THEN 1 ELSE 0 END)::int AS nb_paniers,
  SUM(CASE WHEN pt.deplacement THEN 1 ELSE 0 END)::int AS nb_deplacements,
  CASE
    WHEN BOOL_AND(pt.statut = 'validee') THEN 'validee'
    WHEN BOOL_OR(pt.statut = 'en_cours') THEN 'brouillon'
    ELSE 'soumise'
  END AS statut,
  MAX(pt.updated_at) AS updated_at
FROM periodes_travail pt
JOIN chantiers c ON c.id = pt.chantier_id
CROSS JOIN LATERAL calculer_heures_cadre_chantier(pt.heure_debut, pt.heure_fin, c.heure_debut, c.heure_fin) h
WHERE pt.statut != 'rejetee' AND pt.heure_fin IS NOT NULL
GROUP BY pt.user_id, pt.chantier_id, pt.date;
