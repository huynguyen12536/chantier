/**
 * Imp-09 Realtime module — SSE transport (server → client only).
 *
 * Producer path (DR-IMP09-003): notificationHooks.emitDomainEvent → dispatcher → SSE.
 * No second bus; Imp-07 remains the review event producer API.
 */

import routes from './routes.js';
import { clearClients, setHeartbeatIntervalMs, resetEventIdForTests } from './sseRegistry.js';
import { dispatchDomainEvent } from './dispatcher.js';

export function initRealtime(options = {}) {
  if (options.heartbeatMs != null) setHeartbeatIntervalMs(options.heartbeatMs);
}

export function shutdownRealtime() {
  clearClients();
}

export function resetRealtimeForTests(options = {}) {
  shutdownRealtime();
  resetEventIdForTests();
  if (options.heartbeatMs != null) setHeartbeatIntervalMs(options.heartbeatMs);
}

export { routes as realtimeRoutes, dispatchDomainEvent };
export { EVENT_TYPES } from './eventTypes.js';
export { expandToCatalogEvents } from './dispatcher.js';
export { clientMayReceive } from './scope.js';
