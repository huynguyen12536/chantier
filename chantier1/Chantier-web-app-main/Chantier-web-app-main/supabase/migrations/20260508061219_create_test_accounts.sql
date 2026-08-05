
/*
  # Create test accounts for all roles

  Creates 4 test user accounts, one for each role in the system:
  - admin: admin@test.com
  - administratif: administratif@test.com
  - chef_equipe: chef@test.com
  - ouvrier: ouvrier@test.com

  All accounts use password: 123456
  Uses Supabase's auth.users table and profiles table.
*/

-- Bật pgcrypto để dùng crypt() và gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert auth users directly
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'administratif@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
),
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'chef@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
),
(
  'aaaaaaaa-0004-0004-0004-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'ouvrier@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Insert identities for each user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'admin@test.com',
  '{"sub":"aaaaaaaa-0001-0001-0001-000000000001","email":"admin@test.com"}',
  'email',
  now(),
  now(),
  now()
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'administratif@test.com',
  '{"sub":"aaaaaaaa-0002-0002-0002-000000000002","email":"administratif@test.com"}',
  'email',
  now(),
  now(),
  now()
),
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'aaaaaaaa-0003-0003-0003-000000000003',
  'chef@test.com',
  '{"sub":"aaaaaaaa-0003-0003-0003-000000000003","email":"chef@test.com"}',
  'email',
  now(),
  now(),
  now()
),
(
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'ouvrier@test.com',
  '{"sub":"aaaaaaaa-0004-0004-0004-000000000004","email":"ouvrier@test.com"}',
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert profiles
INSERT INTO public.profiles (id, email, nom, prenom, matricule, role, created_at, updated_at)
VALUES
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'admin@test.com',
  'Admin',
  'Test',
  'ADM001',
  'admin',
  now(),
  now()
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'administratif@test.com',
  'Administratif',
  'Test',
  'ADM002',
  'administratif',
  now(),
  now()
),
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'chef@test.com',
  'Chef',
  'Equipe',
  'CHF001',
  'chef_equipe',
  now(),
  now()
),
(
  'aaaaaaaa-0004-0004-0004-000000000004',
  'ouvrier@test.com',
  'Ouvrier',
  'Test',
  'OUV001',
  'ouvrier',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
