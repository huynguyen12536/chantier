/**
 * NotificationHooks — contract-equivalent change signals (transport deferred).
 * Controllers/jobs may register; default is no-op / structured log.
 */
import { logger } from '../../../shared/utils/logger.js';

const subscribers = new Set();

export function subscribe(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

export function clearSubscribers() {
  subscribers.clear();
}

/**
 * Fire after successful COMMIT. Never throws to caller.
 */
export function emitReviewEvent(event) {
  try {
    logger.info('review.event', {
      type: event.type,
      entityId: event.entityId,
      statut: event.statut,
      actorId: event.actorId,
    });
    for (const handler of subscribers) {
      try {
        handler(event);
      } catch (err) {
        logger.error('review.event.handler_failed', { message: err.message });
      }
    }
  } catch (err) {
    logger.error('review.event.emit_failed', { message: err.message });
  }
}
