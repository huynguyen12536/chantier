/*
  # Add date fields to worksite assignments

  1. Changes to Tables
    - `affectations_chantiers`
      - Add `date_debut` (date) - Assignment start date
      - Add `date_fin` (date, nullable) - Assignment end date (null = ongoing)
      
  2. Notes
    - Existing assignments will have date_debut set to today's date
    - date_fin is nullable to support ongoing assignments
    - Check constraint ensures date_fin is after date_debut
*/

-- Add date_debut column with default value for existing rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affectations_chantiers' AND column_name = 'date_debut'
  ) THEN
    ALTER TABLE affectations_chantiers ADD COLUMN date_debut date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add date_fin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affectations_chantiers' AND column_name = 'date_fin'
  ) THEN
    ALTER TABLE affectations_chantiers ADD COLUMN date_fin date;
  END IF;
END $$;

-- Add check constraint to ensure valid date range
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

-- Create index for active assignments lookup (without WHERE clause to avoid IMMUTABLE function issue)
CREATE INDEX IF NOT EXISTS idx_affectations_dates 
  ON affectations_chantiers(user_id, date_debut, date_fin);
