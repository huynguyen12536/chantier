-- Imp-05 Parity Patch — schema alignment to CVL (production-dump + database-schema.md)
-- Keep Zone RESTRICT (already PASS). Idempotent under parallel test runners.

DO $$
BEGIN
  ALTER TABLE affectations_chantiers
    ADD CONSTRAINT valid_affectation_date_range
    CHECK (date_fin IS NULL OR date_fin >= date_debut);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_affectations_chef ON affectations_chantiers (chef_equipe_id);
CREATE INDEX IF NOT EXISTS idx_affectations_dates ON affectations_chantiers (user_id, date_debut, date_fin);

ALTER TABLE zones_equipe
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE zones_ouvriers
  DROP CONSTRAINT IF EXISTS zones_ouvriers_zone_id_user_id_key;
