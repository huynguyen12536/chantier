/**
 * Imp-06 minimal thaw — emit domain events AFTER withTransaction COMMIT.
 * No business / validation / schema change.
 */

import { emitDomainEvent } from '../../validation/services/notificationHooks.js';
import { EVENT_TYPES } from '../../realtime/eventTypes.js';

function baseFrom(period, declaration, actorId) {
  return {
    userId: period?.user_id ?? declaration?.user_id ?? null,
    chantierId: period?.chantier_id ?? declaration?.chantier_id ?? null,
    actorId: actorId ?? null,
    source: 'imp06',
  };
}

function emitDeclarationSideEffects(declaration, actorId, period) {
  if (!declaration?.id) return;
  const base = baseFrom(period, declaration, actorId);
  const statut = declaration.statut;

  if (statut === 'validee') {
    emitDomainEvent({
      type: EVENT_TYPES.DECLARATION_APPROVED,
      entityId: declaration.id,
      statut,
      ...base,
    });
    return;
  }
  if (statut === 'soumise') {
    emitDomainEvent({
      type: EVENT_TYPES.DECLARATION_SUBMITTED,
      entityId: declaration.id,
      statut,
      ...base,
    });
    return;
  }
  emitDomainEvent({
    type: EVENT_TYPES.DECLARATION_UPDATED,
    entityId: declaration.id,
    statut,
    ...base,
  });
}

/**
 * @param {'created'|'updated'|'deleted'} action
 * @param {{ period?: object|null, declaration?: object|null, actorId: string }} ctx
 */
export function emitAfterPeriodMutation(action, { period, declaration, actorId }) {
  const base = baseFrom(period, declaration, actorId);
  if (period?.id) {
    const type =
      action === 'created'
        ? EVENT_TYPES.PERIOD_CREATED
        : action === 'deleted'
          ? EVENT_TYPES.PERIOD_DELETED
          : EVENT_TYPES.PERIOD_UPDATED;
    emitDomainEvent({
      type,
      entityId: period.id,
      statut: period.statut ?? null,
      ...base,
    });
  }
  emitDeclarationSideEffects(declaration, actorId, period);
}
