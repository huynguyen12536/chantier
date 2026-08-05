-- ============================================================================
-- SCRIPT DE VÉRIFICATION DES DONNÉES
-- ============================================================================

-- 1. Compter les enregistrements dans chaque table
SELECT 'RÉSUMÉ DES DONNÉES' as section;

SELECT 
  'profiles' as table_name, 
  COUNT(*) as total_records,
  STRING_AGG(DISTINCT role, ', ') as roles_disponibles
FROM profiles
UNION ALL
SELECT 
  'chantiers', 
  COUNT(*),
  STRING_AGG(DISTINCT CASE WHEN actif THEN 'actif' ELSE 'inactif' END, ', ')
FROM chantiers
UNION ALL
SELECT 
  'affectations_chantiers', 
  COUNT(*),
  COUNT(DISTINCT user_id)::text || ' users affectés'
FROM affectations_chantiers
UNION ALL
SELECT 
  'periodes_travail', 
  COUNT(*),
  STRING_AGG(DISTINCT statut, ', ')
FROM periodes_travail
UNION ALL
SELECT 
  'declarations_heures', 
  COUNT(*),
  STRING_AGG(DISTINCT statut, ', ')
FROM declarations_heures;

-- 2. Détail des utilisateurs et leurs rôles
SELECT 'UTILISATEURS PAR RÔLE' as section;

SELECT 
  role,
  COUNT(*) as nombre,
  STRING_AGG(prenom || ' ' || nom, ', ') as utilisateurs
FROM profiles 
GROUP BY role 
ORDER BY role;

-- 3. Affectations par chantier
SELECT 'AFFECTATIONS PAR CHANTIER' as section;

SELECT 
  c.nom as chantier,
  c.code,
  COUNT(a.user_id) as nb_ouvriers,
  STRING_AGG(p.prenom || ' ' || p.nom || ' (' || p.role || ')', ', ') as equipe
FROM chantiers c
LEFT JOIN affectations_chantiers a ON c.id = a.chantier_id AND a.date_fin IS NULL
LEFT JOIN profiles p ON a.user_id = p.id
GROUP BY c.id, c.nom, c.code
ORDER BY c.code;

-- 4. Résumé des heures par utilisateur
SELECT 'HEURES PAR UTILISATEUR' as section;

SELECT 
  p.prenom || ' ' || p.nom as utilisateur,
  p.role,
  COUNT(pt.id) as nb_periodes,
  ROUND(
    SUM(
      EXTRACT(EPOCH FROM (pt.heure_fin::time - pt.heure_debut::time)) / 3600
    )::numeric, 2
  ) as total_heures,
  STRING_AGG(DISTINCT pt.statut, ', ') as statuts
FROM profiles p
LEFT JOIN periodes_travail pt ON p.id = pt.user_id
WHERE p.role IN ('ouvrier', 'chef_equipe')
GROUP BY p.id, p.prenom, p.nom, p.role
ORDER BY p.role, total_heures DESC;

-- 5. Périodes de travail par date
SELECT 'PÉRIODES PAR DATE' as section;

SELECT 
  pt.date,
  TO_CHAR(pt.date, 'Day') as jour_semaine,
  COUNT(*) as nb_periodes,
  COUNT(DISTINCT pt.user_id) as nb_ouvriers,
  STRING_AGG(DISTINCT pt.statut, ', ') as statuts
FROM periodes_travail pt
GROUP BY pt.date
ORDER BY pt.date DESC;

-- 6. Vérification de l'intégrité des données
SELECT 'VÉRIFICATIONS D''INTÉGRITÉ' as section;

-- Vérifier que tous les users ont un profil
SELECT 
  'Users sans profil' as verification,
  COUNT(*) as problemes
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Vérifier les affectations orphelines
SELECT 
  'Affectations orphelines' as verification,
  COUNT(*) as problemes
FROM affectations_chantiers a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN chantiers c ON a.chantier_id = c.id
WHERE p.id IS NULL OR c.id IS NULL;

-- Vérifier les périodes sans affectation
SELECT 
  'Périodes sans affectation' as verification,
  COUNT(*) as problemes
FROM periodes_travail pt
LEFT JOIN affectations_chantiers a ON (
  pt.user_id = a.user_id 
  AND pt.chantier_id = a.chantier_id
  AND pt.date >= a.date_debut
  AND (a.date_fin IS NULL OR pt.date <= a.date_fin)
)
WHERE a.id IS NULL;

-- 7. Statistiques des déclarations
SELECT 'STATISTIQUES DÉCLARATIONS' as section;

SELECT 
  statut,
  COUNT(*) as nombre,
  ROUND(AVG(heures_normales + heures_supplementaires), 2) as heures_moyenne,
  SUM(nb_paniers) as total_paniers,
  SUM(nb_deplacements) as total_deplacements
FROM declarations_heures
GROUP BY statut
ORDER BY statut;

-- Message de fin
SELECT 'VÉRIFICATION TERMINÉE ✅' as section;