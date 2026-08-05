-- Imp-05 Parity (reworked) — ADDITIVE ONLY
-- Unified DB = UNION of legacy sources. No DROP / destructive ALTER.
-- Source: production-dump CHECK + indexes; repo zones_equipe.description.

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

-- UNIQUE(zone_id, user_id) retained from migration 004 (Unified Platform).
-- NEVER drop — Consolidation rule: preserve information from either legacy /
-- prior unified migrations unless Decision Log authorizes removal.
