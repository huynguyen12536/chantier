
CREATE TABLE IF NOT EXISTS zones_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_equipe_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones_equipe ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS zones_chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES zones_equipe(id) ON DELETE CASCADE,
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (zone_id, chantier_id)
);

ALTER TABLE zones_chantiers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS zones_ouvriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES zones_equipe(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones_ouvriers ENABLE ROW LEVEL SECURITY;
