/*
  # Allow admins to edit user profiles

  The management screen updates public.profiles directly when an admin edits a
  user. The base policy only allowed users to update their own profile, so admin
  edits of other users were blocked by RLS.
*/

DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
