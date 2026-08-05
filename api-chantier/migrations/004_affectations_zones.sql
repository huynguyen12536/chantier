-- Imp-05 Assignments & Zones (CVL affectations + zones_*)

CREATE TABLE IF NOT EXISTS affectations_chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers (id) ON DELETE CASCADE,
  chef_equipe_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chantier_id)
);

CREATE INDEX IF NOT EXISTS affectations_user_idx ON affectations_chantiers (user_id);
CREATE INDEX IF NOT EXISTS affectations_chantier_idx ON affectations_chantiers (chantier_id);

CREATE TABLE IF NOT EXISTS zones_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  chef_equipe_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones_chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones_equipe (id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers (id) ON DELETE CASCADE,
  UNIQUE (zone_id, chantier_id)
);

CREATE TABLE IF NOT EXISTS zones_ouvriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones_equipe (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  UNIQUE (zone_id, user_id)
);
