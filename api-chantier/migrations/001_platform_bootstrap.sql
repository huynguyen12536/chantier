-- Imp-01 Platform bootstrap
-- Creates migration bookkeeping only — no business entities.
-- Business schema lands in later Imp modules (Users, Sites, Timesheet, …).

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schema_migrations IS 'Unified Platform migration bookkeeping (api-chantier)';
