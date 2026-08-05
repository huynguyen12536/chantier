/*
  # Schéma BTP - Gestion des heures de travail

  ## Description
  Système de déclaration d'heures pour entreprises du BTP avec validation hiérarchique.
  Remplace les fiches papier de déclaration d'heures.

  ## 1. Nouvelles Tables

  ### `profiles`
  - `id` (uuid, FK vers auth.users) - Identifiant utilisateur
  - `email` (text) - Email de l'utilisateur
  - `nom` (text) - Nom de famille
  - `prenom` (text) - Prénom
  - `matricule` (text, unique) - Numéro matricule
  - `role` (text) - Rôle: ouvrier, chef_equipe, administratif, admin
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ### `chantiers`
  - `id` (uuid) - Identifiant unique
  - `nom` (text) - Nom du chantier
  - `code` (text, unique) - Code unique du chantier
  - `adresse` (text) - Adresse du chantier
  - `actif` (boolean) - Chantier actif ou non
  - `date_debut` (date) - Date de début
  - `date_fin` (date, nullable) - Date de fin prévue
  - `created_at` (timestamptz) - Date de création

  ### `affectations_chantiers`
  - `id` (uuid) - Identifiant unique
  - `user_id` (uuid, FK) - Ouvrier affecté
  - `chantier_id` (uuid, FK) - Chantier
  - `chef_equipe_id` (uuid, FK, nullable) - Chef d'équipe responsable
  - `created_at` (timestamptz) - Date d'affectation

  ### `declarations_heures`
  - `id` (uuid) - Identifiant unique
  - `user_id` (uuid, FK) - Ouvrier
  - `chantier_id` (uuid, FK) - Chantier
  - `date` (date) - Date de travail
  - `heures_normales` (decimal) - Heures normales travaillées
  - `heures_supplementaires` (decimal) - Heures supplémentaires
  - `nb_paniers` (integer) - Nombre de paniers (0, 1 ou 2)
  - `statut` (text) - Statut: brouillon, soumise, validee, rejetee
  - `commentaire` (text, nullable) - Commentaire optionnel
  - `validated_by` (uuid, FK, nullable) - Validé par (chef/admin)
  - `validated_at` (timestamptz, nullable) - Date de validation
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ## 2. Sécurité (RLS)
  
  Toutes les tables ont RLS activé avec des politiques restrictives.
  
  ### Politiques principales:
  - **Profiles**: Les utilisateurs peuvent voir leur propre profil, les chefs peuvent voir leur équipe
  - **Chantiers**: Visibles par tous les utilisateurs authentifiés
  - **Affectations**: Visibles selon le rôle (ouvrier voit les siennes, chef voit son équipe)
  - **Déclarations**: Ouvrier gère les siennes, chef valide son équipe, admin voit tout

  ## 3. Index
  
  Index créés pour optimiser les requêtes fréquentes:
  - Recherche par matricule
  - Recherche par code chantier
  - Déclarations par utilisateur et date
  - Affectations par chantier et utilisateur

  ## 4. Valeurs par défaut
  
  - Chantiers actifs par défaut
  - Déclarations en statut "brouillon" par défaut
  - Paniers à 0 par défaut
  - Timestamps automatiques
*/

-- Création de la table profiles (extension de auth.users)
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

-- Création de la table chantiers
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

-- Création de la table affectations_chantiers
CREATE TABLE IF NOT EXISTS affectations_chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  chef_equipe_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chantier_id)
);

-- Création de la table declarations_heures
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

-- Index pour optimiser les requêtes
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

-- Activation de RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations_heures ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Chefs and admins can view team profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('chef_equipe', 'admin', 'administratif')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Politiques RLS pour chantiers
CREATE POLICY "Authenticated users can view active chantiers"
  ON chantiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert chantiers"
  ON chantiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Admins can update chantiers"
  ON chantiers FOR UPDATE
  TO authenticated
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

-- Politiques RLS pour affectations_chantiers
CREATE POLICY "Users can view own affectations"
  ON affectations_chantiers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chefs can view their team affectations"
  ON affectations_chantiers FOR SELECT
  TO authenticated
  USING (chef_equipe_id = auth.uid());

CREATE POLICY "Admins can view all affectations"
  ON affectations_chantiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Admins can insert affectations"
  ON affectations_chantiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif', 'chef_equipe')
    )
  );

CREATE POLICY "Admins can update affectations"
  ON affectations_chantiers FOR UPDATE
  TO authenticated
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

-- Politiques RLS pour declarations_heures
CREATE POLICY "Users can view own declarations"
  ON declarations_heures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chefs can view their team declarations"
  ON declarations_heures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affectations_chantiers a
      WHERE a.user_id = declarations_heures.user_id
      AND a.chantier_id = declarations_heures.chantier_id
      AND a.chef_equipe_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all declarations"
  ON declarations_heures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'administratif')
    )
  );

CREATE POLICY "Users can insert own declarations"
  ON declarations_heures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft declarations"
  ON declarations_heures FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND statut = 'brouillon')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chefs can update team declarations for validation"
  ON declarations_heures FOR UPDATE
  TO authenticated
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
  ON declarations_heures FOR UPDATE
  TO authenticated
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
  ON declarations_heures FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND statut = 'brouillon');
