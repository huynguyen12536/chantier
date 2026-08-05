-- Imp-06 parity — ADDITIVE CHECK constraints from production-dump (P4).
-- No DROP / rename. GPS fin coherence CHECK skipped (columns not in Unified 005 — accepted drift).

DO $$
BEGIN
  ALTER TABLE periodes_travail
    ADD CONSTRAINT periodes_travail_open_statut_check
    CHECK (
      (heure_fin IS NULL AND statut = 'en_cours')
      OR (heure_fin IS NOT NULL AND statut <> 'en_cours')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE declarations_heures
    ADD CONSTRAINT declarations_heures_heures_normales_check
    CHECK (heures_normales >= 0 AND heures_normales <= 24);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE declarations_heures
    ADD CONSTRAINT declarations_heures_heures_supplementaires_check
    CHECK (heures_supplementaires >= 0 AND heures_supplementaires <= 24);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE declarations_heures
    ADD CONSTRAINT declarations_heures_nb_paniers_check
    CHECK (nb_paniers >= 0 AND nb_paniers <= 2);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
