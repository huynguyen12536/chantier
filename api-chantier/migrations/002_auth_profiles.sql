-- Imp-02 Authentication — identity tables for Unified Platform
-- Maps CVL auth.users 1:1 profiles without inventing Company/Super Admin.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE profile_role AS ENUM ('ouvrier', 'chef_equipe', 'administratif', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role profile_role NOT NULL,
  nom TEXT,
  prenom TEXT,
  matricule TEXT,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_actif_idx ON profiles (actif);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_profile_idx ON refresh_tokens (profile_id);

COMMENT ON TABLE profiles IS 'CVL profiles + local credential store (replaces Supabase Auth for Unified Platform)';
COMMENT ON TABLE refresh_tokens IS 'Refresh token store for JWT lifecycle (Imp-02)';
