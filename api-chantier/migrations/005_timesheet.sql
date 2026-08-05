-- Imp-06 Timesheet tables (CVL periodes_travail + declarations_heures)
-- Business logic lives in application services — not SQL triggers.

CREATE TABLE IF NOT EXISTS periodes_travail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers (id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  panier BOOLEAN NOT NULL DEFAULT FALSE,
  deplacement BOOLEAN NOT NULL DEFAULT FALSE,
  from_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
  statut TEXT NOT NULL DEFAULT 'terminee'
    CHECK (statut IN ('en_cours', 'terminee', 'validee', 'rejetee')),
  validated_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT periodes_heure_coherence CHECK (
    heure_fin IS NULL OR heure_fin >= heure_debut
  )
);

CREATE INDEX IF NOT EXISTS periodes_user_date_idx ON periodes_travail (user_id, date);
CREATE INDEX IF NOT EXISTS periodes_chantier_date_idx ON periodes_travail (chantier_id, date);
CREATE INDEX IF NOT EXISTS periodes_key_idx ON periodes_travail (user_id, chantier_id, date);

CREATE TABLE IF NOT EXISTS declarations_heures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers (id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heures_normales NUMERIC(6, 2) NOT NULL DEFAULT 0,
  heures_supplementaires NUMERIC(6, 2) NOT NULL DEFAULT 0,
  nb_paniers INTEGER NOT NULL DEFAULT 0,
  nb_deplacements INTEGER NOT NULL DEFAULT 0,
  from_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
  statut TEXT NOT NULL DEFAULT 'soumise'
    CHECK (statut IN ('brouillon', 'soumise', 'validee', 'rejetee', 'annulee')),
  validated_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chantier_id, date)
);

CREATE INDEX IF NOT EXISTS declarations_statut_idx ON declarations_heures (statut);
CREATE INDEX IF NOT EXISTS declarations_user_date_idx ON declarations_heures (user_id, date);

-- System actor for auto-approve audit trail (DR-IMP06-003)
INSERT INTO profiles (id, email, password_hash, role, nom, prenom, actif)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'system.auto-approve@platform.local',
  crypt('locked-system-actor-not-for-login', gen_salt('bf')),
  'admin',
  'System',
  'AutoApprove',
  TRUE
)
ON CONFLICT (email) DO NOTHING;
