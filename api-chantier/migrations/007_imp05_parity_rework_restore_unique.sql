-- Imp-05 Parity Rework — restore UNIQUE if prior destructive 006 removed it.
-- ADDITIVE ONLY. Reinstates constraint from migration 004 / Unified Platform.

DO $$
BEGIN
  ALTER TABLE zones_ouvriers
    ADD CONSTRAINT zones_ouvriers_zone_id_user_id_key UNIQUE (zone_id, user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN
    RAISE EXCEPTION
      'Cannot restore UNIQUE(zone_id,user_id): duplicate rows exist. Deduplicate before re-adding.';
END $$;
