-- ============================================================================
-- SCRIPT KIỂM TRA TÀI KHOẢN ĐÃ TẠO
-- ============================================================================

-- 1. Kiểm tra profiles đã tạo
SELECT 
  'Profiles' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'chef_equipe' THEN 1 END) as chef_count,
  COUNT(CASE WHEN role = 'ouvrier' THEN 1 END) as ouvrier_count,
  COUNT(CASE WHEN role = 'administratif' THEN 1 END) as admin_count
FROM profiles;

-- 2. Danh sách tài khoản chi tiết
SELECT 
  email,
  nom,
  prenom, 
  matricule,
  role,
  created_at
FROM profiles 
ORDER BY role, created_at;

-- 3. Kiểm tra affectations chantiers
SELECT 
  p.email,
  p.nom + ' ' + p.prenom as full_name,
  p.role,
  c.nom as chantier_name,
  c.code as chantier_code,
  a.date_debut,
  chef.nom + ' ' + chef.prenom as chef_name
FROM affectations_chantiers a
JOIN profiles p ON a.user_id = p.id
JOIN chantiers c ON a.chantier_id = c.id
LEFT JOIN profiles chef ON a.chef_equipe_id = chef.id
WHERE a.date_fin IS NULL
ORDER BY p.role, p.nom;

-- 4. Kiểm tra périodes de travail
SELECT 
  p.email,
  p.nom + ' ' + p.prenom as worker_name,
  c.nom as chantier_name,
  pt.date,
  pt.heure_debut,
  pt.heure_fin,
  pt.statut,
  pt.panier_repas,
  pt.deplacement
FROM periodes_travail pt
JOIN profiles p ON pt.user_id = p.id
JOIN chantiers c ON pt.chantier_id = c.id
ORDER BY pt.date DESC, p.nom;

-- 5. Résumé par role
SELECT 
  role,
  COUNT(*) as user_count,
  STRING_AGG(email, ', ') as emails
FROM profiles 
GROUP BY role
ORDER BY role;

-- 6. Vérification des données manquantes
SELECT 
  'Missing Data Check' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles) = 0 THEN 'ERROR: No profiles found'
    WHEN (SELECT COUNT(*) FROM chantiers) = 0 THEN 'ERROR: No chantiers found'  
    WHEN (SELECT COUNT(*) FROM affectations_chantiers) = 0 THEN 'ERROR: No affectations found'
    ELSE 'OK: All data present'
  END as status;