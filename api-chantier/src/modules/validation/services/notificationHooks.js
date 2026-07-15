/**
 * NotificationHooks — Imp-07 producer; Imp-09 dispatcher attached at emit exit.
 * Controllers must call only AFTER successful COMMIT. Never throws to caller.
 *
 * DR-IMP09-003: Reuse this module — do not move review logic; Imp-09 only transports.
 */
import { logger } from '../../../shared/utils/logger.js';
import { dispatchDomainEvent } from '../../realtime/dispatcher.js';

const subscribers = new Set();

export function subscribe(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

export function clearSubscribers() {
  subscribers.clear();
}

/**
 * Fire after successful COMMIT.
 * Notifies in-process subscribers (tests / future observers) then SSE dispatcher.
 */
export function emitDomainEvent(event) {
  try {
    logger.info('domain.event', {
      type: event.type,
      entityId: event.entityId,
      statut: event.statut,
      actorId: event.actorId,
    });
    for (const handler of subscribers) {
      try {
        handler(event);
      } catch (err) {
        logger.error('domain.event.handler_failed', { message: err.message });
      }
    }
    dispatchDomainEvent(event);
  } catch (err) {
    logger.error('domain.event.emit_failed', { message: err.message });
  }
}

/** Imp-07 API — thin alias over emitDomainEvent (DR-IMP09-003). */
export function emitReviewEvent(event) {
  emitDomainEvent(event);
}
