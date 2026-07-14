/**
 * AuditService — append-only approval history (Unified approval_audit_events).
 */
import * as repo from '../repository.js';
import { mapAuditEvent } from '../dto.js';

export async function recordDecisionAudit(client, {
  entityType,
  entityId,
  declarationId,
  action,
  fromStatut,
  toStatut,
  actorId,
  reason,
  correlationId,
}) {
  const row = await repo.insertAuditEvent(client, {
    entity_type: entityType,
    entity_id: entityId,
    declaration_id: declarationId,
    action,
    from_statut: fromStatut,
    to_statut: toStatut,
    actor_id: actorId,
    reason,
    correlation_id: correlationId,
  });
  return mapAuditEvent(row);
}

export async function listDeclarationHistory(declarationId) {
  const rows = await repo.listAuditByDeclaration(declarationId);
  return rows.map(mapAuditEvent);
}
