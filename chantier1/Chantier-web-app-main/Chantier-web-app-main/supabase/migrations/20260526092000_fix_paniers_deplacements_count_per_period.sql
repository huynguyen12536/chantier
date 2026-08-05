/*
  Fix: nb_paniers et nb_deplacements doivent compter par période (ca),
  pas un booléen par jour/chantier.
  Exemple: 2 périodes le même jour avec panier → nb_paniers = 2.
*/

DROP VIEW IF EXISTS synthese_heures_journalieres CASCADE;

CREATE VIEW synthese_heures_journalieres AS
SELECT
  pt.user_id,
  pt.chantier_id,
  pt.date,
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
CROSS JOIN LATERAL calculer_heures_cadre_chantier(
  pt.heure_debut,
  pt.heure_fin,
  c.heure_debut,
  c.heure_fin
) h
WHERE pt.statut != 'rejetee'
  AND pt.heure_fin IS NOT NULL
GROUP BY pt.user_id, pt.chantier_id, pt.date;
