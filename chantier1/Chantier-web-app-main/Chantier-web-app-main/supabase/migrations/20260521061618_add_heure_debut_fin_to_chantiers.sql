/*
  # Add heure_debut and heure_fin to chantiers

  1. Changes
    - `heure_debut` (time, nullable) — heure de début de la journée de travail sur le chantier
    - `heure_fin`   (time, nullable) — heure de fin   de la journée de travail sur le chantier
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chantiers' AND column_name = 'heure_debut'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN heure_debut time DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chantiers' AND column_name = 'heure_fin'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN heure_fin time DEFAULT NULL;
  END IF;
END $$;
