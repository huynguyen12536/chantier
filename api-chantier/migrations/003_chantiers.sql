-- Imp-04 Construction Sites (chantiers) — CVL schema core fields

CREATE TABLE IF NOT EXISTS chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  adresse TEXT,
  date_debut DATE,
  date_fin DATE,
  heure_debut_matin TIME,
  heure_fin_matin TIME,
  heure_debut_apres_midi TIME,
  heure_fin_apres_midi TIME,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chantiers_actif_idx ON chantiers (actif);
