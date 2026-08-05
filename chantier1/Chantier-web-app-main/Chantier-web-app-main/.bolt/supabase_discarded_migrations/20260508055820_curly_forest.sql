/*
  # Tạo dữ liệu mẫu cho hệ thống BTP

  1. Chantiers (Công trường)
    - 3 chantiers với các thông tin khác nhau
    - Trạng thái active và địa chỉ cụ thể

  2. Profiles (Người dùng)
    - Admin: Quản trị toàn hệ thống
    - Chef d'équipe: Quản lý nhóm
    - Ouvriers: Công nhân khai báo giờ
    - Administratif: Xuất dữ liệu lương

  3. Affectations (Phân công)
    - Gán công nhân vào các chantiers
    - Thiết lập chef d'équipe cho từng nhóm

  4. Dữ liệu test
    - Periods de travail (ca làm việc)
    - Declarations heures (khai báo giờ)
    - Các trạng thái khác nhau
*/

-- ============================================================================
-- 1. CHANTIERS (Công trường)
-- ============================================================================

INSERT INTO chantiers (id, nom, code, adresse, actif, date_debut, date_fin) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Construction Villa Moderne', 'CV-001', '15 Avenue des Champs-Élysées, 75008 Paris', true, '2024-01-15', null),
  ('22222222-2222-2222-2222-222222222222', 'Rénovation Immeuble Haussmann', 'RJ-002', '42 Boulevard Saint-Germain, 75005 Paris', true, '2024-02-01', null),
  ('33333333-3333-3333-3333-333333333333', 'Extension Centre Commercial', 'ECC-003', '128 Rue de la République, 69002 Lyon', true, '2024-03-01', '2024-12-31');

-- ============================================================================
-- 2. PROFILES (Utilisateurs avec rôles)
-- ============================================================================

-- IMPORTANT: Ces UUIDs doivent correspondre aux users créés dans Supabase Auth
INSERT INTO profiles (id, email, nom, prenom, matricule, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@test.fr', 'Durand', 'Sophie', 'ADMIN-001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'chef@test.fr', 'Martin', 'Pierre', 'CHEF-001', 'chef_equipe'),
  ('00000000-0000-0000-0000-000000000003', 'ouvrier@test.fr', 'Dupont', 'Jean', 'OUV-001', 'ouvrier'),
  ('00000000-0000-0000-0000-000000000004', 'admin-paie@test.fr', 'Moreau', 'Marie', 'ADM-001', 'administratif'),
  ('00000000-0000-0000-0000-000000000005', 'ouvrier2@test.fr', 'Bernard', 'Paul', 'OUV-002', 'ouvrier');

-- ============================================================================
-- 3. AFFECTATIONS CHANTIERS (Phân công)
-- ============================================================================

-- Chef d'équipe gérant les chantiers CV-001 et RJ-002
INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin) VALUES
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2024-01-15', null),
  ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '2024-02-01', null);

-- Ouvrier 1 affecté aux chantiers CV-001 et RJ-002 sous le chef Pierre
INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin) VALUES
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2024-01-15', null),
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '2024-02-01', null);

-- Ouvrier 2 affecté au chantier CV-001 sous le chef Pierre
INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin) VALUES
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2024-01-15', null);

-- ============================================================================
-- 4. PÉRIODES DE TRAVAIL (Données de test)
-- ============================================================================

-- Semaine dernière - Ouvrier 1 (Jean Dupont)
INSERT INTO periodes_travail (
  user_id, chantier_id, date, heure_debut, heure_fin,
  latitude_debut, longitude_debut, latitude_fin, longitude_fin,
  statut, panier_repas, deplacement
) VALUES
  -- Lundi
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE - INTERVAL '7 days', '07:30:00', '16:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, false),
  
  -- Mardi
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - INTERVAL '6 days', '07:30:00', '17:00:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, true),
   
  -- Mercredi
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   CURRENT_DATE - INTERVAL '5 days', '08:00:00', '16:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, false),
   
  -- Jeudi
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   CURRENT_DATE - INTERVAL '4 days', '07:30:00', '18:00:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, true),
   
  -- Vendredi
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - INTERVAL '3 days', '07:30:00', '16:00:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, false);

-- Cette semaine - Ouvrier 1 (en attente de validation)
INSERT INTO periodes_travail (
  user_id, chantier_id, date, heure_debut, heure_fin,
  latitude_debut, longitude_debut, latitude_fin, longitude_fin,
  statut, panier_repas, deplacement
) VALUES
  -- Lundi cette semaine
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, '07:30:00', '16:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'terminee', true, false),
   
  -- Mardi cette semaine
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, '07:30:00', '17:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'terminee', true, true);

-- Semaine dernière - Ouvrier 2 (Paul Bernard)
INSERT INTO periodes_travail (
  user_id, chantier_id, date, heure_debut, heure_fin,
  latitude_debut, longitude_debut, latitude_fin, longitude_fin,
  statut, panier_repas, deplacement
) VALUES
  -- Lundi
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - INTERVAL '7 days', '08:00:00', '17:00:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, false),
   
  -- Mardi
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - INTERVAL '6 days', '07:30:00', '16:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, false),
   
  -- Mercredi
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - INTERVAL '5 days', '08:00:00', '18:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'validee', true, true);

-- Cette semaine - Ouvrier 2 (en attente)
INSERT INTO periodes_travail (
  user_id, chantier_id, date, heure_debut, heure_fin,
  latitude_debut, longitude_debut, latitude_fin, longitude_fin,
  statut, panier_repas, deplacement
) VALUES
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, '07:30:00', '16:30:00',
   48.8566, 2.3522, 48.8566, 2.3522, 'terminee', true, false);

-- ============================================================================
-- 5. DÉCLARATIONS HEURES (Générées automatiquement par trigger)
-- ============================================================================

-- Les déclarations sont créées automatiquement par le trigger sync_declarations_from_periods()
-- quand on insère/met à jour les périodes de travail

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier les données créées
DO $$
BEGIN
  RAISE NOTICE '=== DONNÉES CRÉÉES ===';
  RAISE NOTICE 'Chantiers: %', (SELECT COUNT(*) FROM chantiers);
  RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Affectations: %', (SELECT COUNT(*) FROM affectations_chantiers);
  RAISE NOTICE 'Périodes: %', (SELECT COUNT(*) FROM periodes_travail);
  RAISE NOTICE 'Déclarations: %', (SELECT COUNT(*) FROM declarations_heures);
  RAISE NOTICE '======================';
END $$;