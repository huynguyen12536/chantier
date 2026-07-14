
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affectations_chantiers' AND column_name = 'date_debut'
  ) THEN
    ALTER TABLE affectations_chantiers ADD COLUMN date_debut date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affectations_chantiers' AND column_name = 'date_fin'
  ) THEN
    ALTER TABLE affectations_chantiers ADD COLUMN date_fin date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_affectation_date_range'
  ) THEN
    ALTER TABLE affectations_chantiers 
      ADD CONSTRAINT valid_affectation_date_range 
      CHECK (date_fin IS NULL OR date_fin >= date_debut);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_affectations_dates 
  ON affectations_chantiers(user_id, date_debut, date_fin);
