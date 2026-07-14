/*
  # Thêm tài khoản người dùng với các role khác nhau

  1. Tài khoản được tạo
    - Admin: admin@gmail.com (123456)
    - Chef d'équipe: chef@gmail.com (123456)
    - Ouvrier: ouvrier@gmail.com (123456)
    - Administratif: admin-paie@gmail.com (123456)
    - Ouvrier 2: ouvrier2@gmail.com (123456)

  2. Phân quyền
    - Admin: Toàn quyền hệ thống
    - Chef: Quản lý nhóm và validation
    - Ouvrier: Khai báo giờ làm việc
    - Administratif: Export dữ liệu lương

  3. Affectations
    - Chef quản lý các chantiers
    - Ouvriers được phân công vào chantiers
*/

-- Bật pgcrypto để dùng crypt() và gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid;
  chef_id uuid;
  ouvrier_id uuid;
  paie_id uuid;
  ouvrier2_id uuid;
BEGIN
  -- Tạo auth users nếu email chưa tồn tại
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  SELECT '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
    'admin@gmail.com', crypt('123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    false, 'authenticated', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  SELECT '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
    'chef@gmail.com', crypt('123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    false, 'authenticated', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chef@gmail.com');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  SELECT '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
    'ouvrier@gmail.com', crypt('123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    false, 'authenticated', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ouvrier@gmail.com');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  SELECT '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
    'admin-paie@gmail.com', crypt('123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    false, 'authenticated', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin-paie@gmail.com');

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  SELECT '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
    'ouvrier2@gmail.com', crypt('123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    false, 'authenticated', 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ouvrier2@gmail.com');

  -- Lấy UUID thực tế (có thể khác hardcoded nếu user đã tồn tại trước)
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
  SELECT id INTO chef_id FROM auth.users WHERE email = 'chef@gmail.com';
  SELECT id INTO ouvrier_id FROM auth.users WHERE email = 'ouvrier@gmail.com';
  SELECT id INTO paie_id FROM auth.users WHERE email = 'admin-paie@gmail.com';
  SELECT id INTO ouvrier2_id FROM auth.users WHERE email = 'ouvrier2@gmail.com';

  -- Thêm profiles dùng UUID thực tế
  INSERT INTO profiles (id, email, nom, prenom, matricule, role)
  VALUES (admin_id, 'admin@gmail.com', 'Nguyen', 'Admin', 'ADM-001', 'admin')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, nom, prenom, matricule, role)
  VALUES (chef_id, 'chef@gmail.com', 'Tran', 'Chef', 'CHEF-001', 'chef_equipe')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, nom, prenom, matricule, role)
  VALUES (ouvrier_id, 'ouvrier@gmail.com', 'Le', 'Ouvrier', 'OUV-001', 'ouvrier')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, nom, prenom, matricule, role)
  VALUES (paie_id, 'admin-paie@gmail.com', 'Pham', 'Paie', 'PAIE-001', 'administratif')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, nom, prenom, matricule, role)
  VALUES (ouvrier2_id, 'ouvrier2@gmail.com', 'Hoang', 'Ouvrier2', 'OUV-002', 'ouvrier')
  ON CONFLICT (id) DO NOTHING;

  -- Affecter le chef d'équipe aux chantiers
  INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut)
  SELECT chef_id, id, chef_id, CURRENT_DATE - INTERVAL '7 days'
  FROM chantiers
  WHERE code IN ('CV-001', 'RJ-002')
  ON CONFLICT DO NOTHING;

  -- Affecter ouvrier 1 aux chantiers sous le chef
  INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut)
  SELECT ouvrier_id, id, chef_id, CURRENT_DATE - INTERVAL '5 days'
  FROM chantiers
  WHERE code IN ('CV-001', 'RJ-002')
  ON CONFLICT DO NOTHING;

  -- Affecter ouvrier 2 à un chantier
  INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut)
  SELECT ouvrier2_id, id, chef_id, CURRENT_DATE - INTERVAL '3 days'
  FROM chantiers
  WHERE code = 'CV-001'
  ON CONFLICT DO NOTHING;

  -- Périodes de travail mẫu (chỉ insert nếu chantier CV-001 tồn tại)
  INSERT INTO periodes_travail (
    user_id, chantier_id, date, heure_debut, heure_fin, statut,
    latitude_debut, longitude_debut, latitude_fin, longitude_fin,
    panier_repas, deplacement
  )
  SELECT ouvrier_id, c.id, CURRENT_DATE - INTERVAL '1 day',
    '07:30:00', '16:30:00', 'validee',
    48.8566, 2.3522, 48.8566, 2.3522, true, false
  FROM chantiers c WHERE c.code = 'CV-001';

  INSERT INTO periodes_travail (
    user_id, chantier_id, date, heure_debut, heure_fin, statut,
    latitude_debut, longitude_debut, latitude_fin, longitude_fin,
    panier_repas, deplacement
  )
  SELECT ouvrier_id, c.id, CURRENT_DATE,
    '07:30:00', '16:00:00', 'terminee',
    48.8566, 2.3522, 48.8566, 2.3522, true, true
  FROM chantiers c WHERE c.code = 'CV-001';

  INSERT INTO periodes_travail (
    user_id, chantier_id, date, heure_debut, heure_fin, statut,
    latitude_debut, longitude_debut, latitude_fin, longitude_fin,
    panier_repas, deplacement
  )
  SELECT ouvrier2_id, c.id, CURRENT_DATE - INTERVAL '1 day',
    '08:00:00', '17:00:00', 'validee',
    48.8566, 2.3522, 48.8566, 2.3522, true, false
  FROM chantiers c WHERE c.code = 'CV-001';

  INSERT INTO periodes_travail (
    user_id, chantier_id, date, heure_debut, heure_fin, statut,
    latitude_debut, longitude_debut, latitude_fin, longitude_fin,
    panier_repas, deplacement
  )
  SELECT ouvrier2_id, c.id, CURRENT_DATE,
    '08:00:00', '16:30:00', 'terminee',
    48.8566, 2.3522, 48.8566, 2.3522, false, true
  FROM chantiers c WHERE c.code = 'CV-001';

END;
$$;
