
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
('aaaaaaaa-0001-0001-0001-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"admin@test.com"}', false, 'authenticated', 'authenticated', '', '', '', ''),
('aaaaaaaa-0002-0002-0002-000000000002', '00000000-0000-0000-0000-000000000000', 'administratif@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"administratif@test.com"}', false, 'authenticated', 'authenticated', '', '', '', ''),
('aaaaaaaa-0003-0003-0003-000000000003', '00000000-0000-0000-0000-000000000000', 'chef@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"chef@test.com"}', false, 'authenticated', 'authenticated', '', '', '', ''),
('aaaaaaaa-0004-0004-0004-000000000004', '00000000-0000-0000-0000-000000000000', 'ouvrier@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"ouvrier@test.com"}', false, 'authenticated', 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), 'aaaaaaaa-0001-0001-0001-000000000001', 'admin@test.com', jsonb_build_object('sub', 'aaaaaaaa-0001-0001-0001-000000000001', 'email', 'admin@test.com', 'email_verified', true), 'email', now(), now(), now()),
(gen_random_uuid(), 'aaaaaaaa-0002-0002-0002-000000000002', 'administratif@test.com', jsonb_build_object('sub', 'aaaaaaaa-0002-0002-0002-000000000002', 'email', 'administratif@test.com', 'email_verified', true), 'email', now(), now(), now()),
(gen_random_uuid(), 'aaaaaaaa-0003-0003-0003-000000000003', 'chef@test.com', jsonb_build_object('sub', 'aaaaaaaa-0003-0003-0003-000000000003', 'email', 'chef@test.com', 'email_verified', true), 'email', now(), now(), now()),
(gen_random_uuid(), 'aaaaaaaa-0004-0004-0004-000000000004', 'ouvrier@test.com', jsonb_build_object('sub', 'aaaaaaaa-0004-0004-0004-000000000004', 'email', 'ouvrier@test.com', 'email_verified', true), 'email', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, nom, prenom, matricule, role, created_at, updated_at)
VALUES
('aaaaaaaa-0001-0001-0001-000000000001', 'admin@test.com', 'Admin', 'Test', 'ADM001', 'admin', now(), now()),
('aaaaaaaa-0002-0002-0002-000000000002', 'administratif@test.com', 'Administratif', 'Test', 'ADM002', 'administratif', now(), now()),
('aaaaaaaa-0003-0003-0003-000000000003', 'chef@test.com', 'Chef', 'Equipe', 'CHF001', 'chef_equipe', now(), now()),
('aaaaaaaa-0004-0004-0004-000000000004', 'ouvrier@test.com', 'Ouvrier', 'Test', 'OUV001', 'ouvrier', now(), now())
ON CONFLICT (id) DO NOTHING;
