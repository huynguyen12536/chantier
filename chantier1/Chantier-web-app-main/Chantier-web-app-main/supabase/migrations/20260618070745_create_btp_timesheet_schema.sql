
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  matricule text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ouvrier', 'chef_equipe', 'administratif', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code text UNIQUE NOT NULL,
  adresse text NOT NULL,
  actif boolean DEFAULT true,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affectations_chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  chef_equipe_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chantier_id)
);

CREATE TABLE IF NOT EXISTS declarations_heures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  heures_normales decimal(4,2) DEFAULT 0 CHECK (heures_normales >= 0 AND heures_normales <= 24),
  heures_supplementaires decimal(4,2) DEFAULT 0 CHECK (heures_supplementaires >= 0 AND heures_supplementaires <= 24),
  nb_paniers integer DEFAULT 0 CHECK (nb_paniers >= 0 AND nb_paniers <= 2),
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'soumise', 'validee', 'rejetee')),
  commentaire text,
  validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chantier_id, date)
);

CREATE INDEX IF NOT EXISTS idx_profiles_matricule ON profiles(matricule);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_chantiers_code ON chantiers(code);
CREATE INDEX IF NOT EXISTS idx_chantiers_actif ON chantiers(actif);
CREATE INDEX IF NOT EXISTS idx_affectations_user ON affectations_chantiers(user_id);
CREATE INDEX IF NOT EXISTS idx_affectations_chantier ON affectations_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_affectations_chef ON affectations_chantiers(chef_equipe_id);
CREATE INDEX IF NOT EXISTS idx_declarations_user ON declarations_heures(user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_date ON declarations_heures(date);
CREATE INDEX IF NOT EXISTS idx_declarations_statut ON declarations_heures(statut);
CREATE INDEX IF NOT EXISTS idx_declarations_chantier ON declarations_heures(chantier_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations_heures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Chefs and admins can view team profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('chef_equipe', 'admin', 'administratif')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view active chantiers"
  ON chantiers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert chantiers"
  ON chantiers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Admins can update chantiers"
  ON chantiers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can view own affectations"
  ON affectations_chantiers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chefs can view their team affectations"
  ON affectations_chantiers FOR SELECT TO authenticated
  USING (chef_equipe_id = auth.uid());

CREATE POLICY "Admins can view all affectations"
  ON affectations_chantiers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Admins can insert affectations"
  ON affectations_chantiers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif', 'chef_equipe')
    )
  );

CREATE POLICY "Admins can update affectations"
  ON affectations_chantiers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif', 'chef_equipe')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif', 'chef_equipe')
    )
  );

CREATE POLICY "Users can view own declarations"
  ON declarations_heures FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chefs can view their team declarations"
  ON declarations_heures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = declarations_heures.user_id
      AND a.chantier_id = declarations_heures.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all declarations"
  ON declarations_heures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can insert own declarations"
  ON declarations_heures FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft declarations"
  ON declarations_heures FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND statut = 'brouillon')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chefs can update team declarations for validation"
  ON declarations_heures FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = declarations_heures.user_id
      AND a.chantier_id = declarations_heures.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
    AND statut IN ('soumise', 'validee')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = declarations_heures.user_id
      AND a.chantier_id = declarations_heures.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all declarations"
  ON declarations_heures FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can delete own draft declarations"
  ON declarations_heures FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND statut = 'brouillon');
