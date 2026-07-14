
-- On hosted Supabase the instance_id must match what GoTrue uses.
-- Many hosted projects use '00000000-0000-0000-0000-000000000000' as default.
-- Let's also ensure the encrypted_password hash is valid by re-setting it.
-- And set raw_user_meta_data with proper format.

UPDATE auth.users
SET 
  encrypted_password = crypt('123456', gen_salt('bf', 10)),
  raw_user_meta_data = jsonb_build_object('email', email, 'email_verified', true),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
  email_confirmed_at = now(),
  updated_at = now(),
  aud = 'authenticated',
  role = 'authenticated'
WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');

-- Ensure identities have correct provider_id format (must be user_id for newer GoTrue)
UPDATE auth.identities
SET 
  provider_id = (SELECT email FROM auth.users WHERE auth.users.id = auth.identities.user_id),
  identity_data = jsonb_build_object(
    'sub', user_id::text,
    'email', (SELECT email FROM auth.users WHERE auth.users.id = auth.identities.user_id),
    'email_verified', true
  ),
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com')
);
