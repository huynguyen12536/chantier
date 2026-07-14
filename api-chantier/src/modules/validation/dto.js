import { mapDeclaration, mapPeriod } from '../timesheet/dto.js';

export { mapDeclaration, mapPeriod };

export function mapQueueItem(row) {
  return mapDeclaration(row);
}

export function mapAuditEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    declaration_id: row.declaration_id,
    action: row.action,
    from_statut: row.from_statut,
    to_statut: row.to_statut,
    actor_id: row.actor_id,
    reason: row.reason,
    correlation_id: row.correlation_id,
    created_at: row.created_at,
  };
}
