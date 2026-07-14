
ALTER TABLE profiles ALTER COLUMN matricule DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN matricule SET DEFAULT '';

ALTER TABLE zones_equipe DROP CONSTRAINT IF EXISTS zones_equipe_chef_equipe_id_fkey;
ALTER TABLE zones_equipe ADD CONSTRAINT zones_equipe_chef_equipe_id_fkey
  FOREIGN KEY (chef_equipe_id) REFERENCES profiles(id) ON DELETE RESTRICT;

DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
CREATE POLICY "Admin can update profiles" ON profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chantiers' AND column_name = 'heure_debut') THEN
    ALTER TABLE chantiers ADD COLUMN heure_debut time DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chantiers' AND column_name = 'heure_fin') THEN
    ALTER TABLE chantiers ADD COLUMN heure_fin time DEFAULT NULL;
  END IF;
END $$;
