/**
 * Imp-09 Realtime module — SSE transport (server → client only).
 *
 * Producer path (DR-IMP09-003): notificationHooks.emitDomainEvent → dispatcher → SSE.
 * No second bus; Imp-07 remains the review event producer API.
 */

import { env } from '../../config/env.js';
import routes from './routes.js';
import { clearClients, setHeartbeatIntervalMs, resetEventIdForTests } from './sseRegistry.js';
import { dispatchDomainEvent, setRetryMs } from './dispatcher.js';

export function initRealtime(options = {}) {
  setHeartbeatIntervalMs(options.heartbeatMs ?? env.sseHeartbeatMs);
  setRetryMs(options.retryMs ?? env.sseRetryMs);
}

export function shutdownRealtime() {
  clearClients();
}

export function resetRealtimeForTests(options = {}) {
  shutdownRealtime();
  resetEventIdForTests();
  setHeartbeatIntervalMs(options.heartbeatMs ?? env.sseHeartbeatMs);
  setRetryMs(options.retryMs ?? env.sseRetryMs);
}

export { routes as realtimeRoutes, dispatchDomainEvent };
export { EVENT_TYPES } from './eventTypes.js';
export { expandToCatalogEvents } from './dispatcher.js';
export { clientMayReceive } from './scope.js';
