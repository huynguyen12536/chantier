
-- Get the correct instance_id and recreate users
DO $$
DECLARE
  v_instance_id uuid;
BEGIN
  -- Get the actual instance_id from the config or use default
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO v_instance_id;

  -- Try to create users using the admin schema approach
  -- First ensure no leftover users exist
  DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com')
  );
  DELETE FROM public.profiles WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');
  DELETE FROM auth.users WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');

  -- Insert users with proper instance_id
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES
    (gen_random_uuid(), v_instance_id, 'admin@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"admin@test.com","email_verified":true}', false, 'authenticated', 'authenticated', '', '', '', ''),
    (gen_random_uuid(), v_instance_id, 'administratif@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"administratif@test.com","email_verified":true}', false, 'authenticated', 'authenticated', '', '', '', ''),
    (gen_random_uuid(), v_instance_id, 'chef@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"chef@test.com","email_verified":true}', false, 'authenticated', 'authenticated', '', '', '', ''),
    (gen_random_uuid(), v_instance_id, 'ouvrier@test.com', crypt('123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"ouvrier@test.com","email_verified":true}', false, 'authenticated', 'authenticated', '', '', '', '');

  -- Create identities
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), id, email,
    jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
    'email', now(), now(), now()
  FROM auth.users
  WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');

  -- Create profiles
  INSERT INTO public.profiles (id, email, nom, prenom, matricule, role)
  SELECT id, email,
    CASE email
      WHEN 'admin@test.com' THEN 'Admin'
      WHEN 'administratif@test.com' THEN 'Administratif'
      WHEN 'chef@test.com' THEN 'Chef'
      WHEN 'ouvrier@test.com' THEN 'Ouvrier'
    END,
    CASE email
      WHEN 'admin@test.com' THEN 'Test'
      WHEN 'administratif@test.com' THEN 'Test'
      WHEN 'chef@test.com' THEN 'Equipe'
      WHEN 'ouvrier@test.com' THEN 'Test'
    END,
    CASE email
      WHEN 'admin@test.com' THEN 'ADM001'
      WHEN 'administratif@test.com' THEN 'ADM002'
      WHEN 'chef@test.com' THEN 'CHF001'
      WHEN 'ouvrier@test.com' THEN 'OUV001'
    END,
    CASE email
      WHEN 'admin@test.com' THEN 'admin'
      WHEN 'administratif@test.com' THEN 'administratif'
      WHEN 'chef@test.com' THEN 'chef_equipe'
      WHEN 'ouvrier@test.com' THEN 'ouvrier'
    END
  FROM auth.users
  WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');
END $$;
