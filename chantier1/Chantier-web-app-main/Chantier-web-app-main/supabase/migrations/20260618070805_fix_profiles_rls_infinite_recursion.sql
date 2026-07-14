
DROP POLICY IF EXISTS "Chefs and admins can view team profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);
