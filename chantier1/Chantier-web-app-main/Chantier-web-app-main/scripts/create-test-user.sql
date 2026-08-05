-- ============================================================================
-- GUIDE: Création d'utilisateurs de test pour l'application BTP
-- ============================================================================
--
-- ÉTAPE 1: Créer l'utilisateur dans Supabase Authentication
-- ----------------------------------------------------------
--
-- 1. Ouvrez votre dashboard Supabase
-- 2. Allez dans "Authentication" > "Users" (menu de gauche)
-- 3. Cliquez sur "Add user" > "Create new user"
-- 4. Remplissez:
--    - Email: ouvrier@test.fr
--    - Password: Test123456!
--    - COCHEZ "Auto Confirm User" (important!)
-- 5. Cliquez sur "Create user"
-- 6. L'utilisateur apparaît dans la liste - CLIQUEZ DESSUS
-- 7. COPIEZ l'UUID (exemple: d46f45a4-d4b7-4192-bcc7-84980ee4fb37)
--
-- ============================================================================
-- ÉTAPE 2: Créer le profil et les affectations dans la base de données
-- ============================================================================
--
-- 1. Allez dans "SQL Editor" (menu de gauche)
-- 2. Cliquez sur "New query"
-- 3. REMPLACEZ 'VOTRE_UUID_ICI' ci-dessous par l'UUID que vous avez copié
-- 4. Collez et exécutez le script suivant:

-- Insérer le profil de l'ouvrier (REMPLACEZ l'UUID!)
INSERT INTO profiles (id, email, nom, prenom, matricule, role) VALUES
  ('VOTRE_UUID_ICI', 'ouvrier@test.fr', 'Dupont', 'Jean', 'OUV-001', 'ouvrier');

-- Affecter l'ouvrier aux chantiers existants
INSERT INTO affectations_chantiers (user_id, chantier_id)
SELECT 'VOTRE_UUID_ICI', id FROM chantiers WHERE code IN ('CV-001', 'RJ-002');

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Une fois exécuté avec succès, vous pouvez vous connecter avec:
-- Email: ouvrier@test.fr
-- Mot de passe: Test123456!
-- ============================================================================


-- ============================================================================
-- OPTIONNEL: Créer un chef d'équipe
-- ============================================================================
--
-- 1. Répétez l'ÉTAPE 1 avec:
--    - Email: chef@test.fr
--    - Password: Test123456!
-- 2. Copiez l'UUID du chef
-- 3. Exécutez:

-- INSERT INTO profiles (id, email, nom, prenom, matricule, role) VALUES
--   ('UUID_DU_CHEF_ICI', 'chef@test.fr', 'Martin', 'Pierre', 'CHEF-001', 'chef_equipe');
--
-- INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id)
-- SELECT 'UUID_DU_CHEF_ICI', id, 'UUID_DU_CHEF_ICI' FROM chantiers WHERE code IN ('CV-001', 'RJ-002');


-- ============================================================================
-- OPTIONNEL: Créer un administrateur
-- ============================================================================
--
-- 1. Répétez l'ÉTAPE 1 avec:
--    - Email: admin@test.fr
--    - Password: Test123456!
-- 2. Copiez l'UUID de l'admin
-- 3. Exécutez:

-- INSERT INTO profiles (id, email, nom, prenom, matricule, role) VALUES
--   ('UUID_DE_ADMIN_ICI', 'admin@test.fr', 'Durand', 'Sophie', 'ADMIN-001', 'admin');
