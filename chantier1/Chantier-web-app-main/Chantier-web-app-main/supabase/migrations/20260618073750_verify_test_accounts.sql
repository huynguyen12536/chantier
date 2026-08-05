
-- Verify: check the test accounts
DO $$
DECLARE
  v_user_count int;
  v_identity_count int;
  v_profile_count int;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM auth.users WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');
  SELECT COUNT(*) INTO v_identity_count FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com'));
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles WHERE email IN ('admin@test.com', 'administratif@test.com', 'chef@test.com', 'ouvrier@test.com');
  
  IF v_user_count != 4 THEN RAISE EXCEPTION 'Expected 4 users, got %', v_user_count; END IF;
  IF v_identity_count != 4 THEN RAISE EXCEPTION 'Expected 4 identities, got %', v_identity_count; END IF;
  IF v_profile_count != 4 THEN RAISE EXCEPTION 'Expected 4 profiles, got %', v_profile_count; END IF;
  
  RAISE NOTICE 'All OK: % users, % identities, % profiles', v_user_count, v_identity_count, v_profile_count;
END $$;
