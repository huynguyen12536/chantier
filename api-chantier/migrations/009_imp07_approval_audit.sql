-- Imp-07 Review & Approval — additive audit/history table (Unified TARGET_DDL).
-- No DROP / rename of timesheet columns. Persistence only.

CREATE TABLE IF NOT EXISTS approval_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('declaration', 'period')),
  entity_id UUID NOT NULL,
  declaration_id UUID REFERENCES declarations_heures (id) ON DELETE SET NULL,
  action TEXT NOT NULL
    CHECK (action IN ('approve', 'reject', 'return', 'cancel', 'period_decide')),
  from_statut TEXT,
  to_statut TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES profiles (id),
  reason TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS approval_audit_declaration_idx
  ON approval_audit_events (declaration_id, created_at DESC);

CREATE INDEX IF NOT EXISTS approval_audit_entity_idx
  ON approval_audit_events (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS approval_audit_actor_idx
  ON approval_audit_events (actor_id, created_at DESC);
