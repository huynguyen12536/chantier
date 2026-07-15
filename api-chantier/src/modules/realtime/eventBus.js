/**
 * In-process domain event façade (Imp-09).
 * Canonical producer API remains validation/notificationHooks.emitDomainEvent.
 */

export { emitDomainEvent, emitReviewEvent, subscribe, clearSubscribers } from '../validation/services/notificationHooks.js';
export { dispatchDomainEvent, expandToCatalogEvents } from './dispatcher.js';
