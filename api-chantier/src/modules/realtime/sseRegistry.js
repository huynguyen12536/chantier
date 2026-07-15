/**
 * SSE client registry — connect / disconnect / heartbeat / cleanup.
 *
 * Lifecycle: addClient → heartbeat loop → writeEvent / removeClient on close.
 * lastEventId is stored for diagnostics only (no replay).
 */

import { env } from '../../config/env.js';
import { formatHeartbeatComment, formatSseMessage } from './serializer.js';
import { logger } from '../../shared/utils/logger.js';

/** @typedef {{
 *   id: string,
 *   res: import('express').Response,
 *   user: { id: string, role: string, email?: string },
 *   chantierIds: string[] | null,
 *   connectedAt: number,
 *   lastEventId: string | null,
 * }} SseClient */

let seq = 0;
/** @type {Map<string, SseClient>} */
const clients = new Map();

/** @type {ReturnType<typeof setInterval> | null} */
let heartbeatTimer = null;
let heartbeatMs = Number(env.sseHeartbeatMs) || 30_000;

export function setHeartbeatIntervalMs(ms) {
  heartbeatMs = Math.max(1_000, Number(ms) || 30_000);
  if (heartbeatTimer) {
    stopHeartbeat();
    startHeartbeat();
  }
}

export function getHeartbeatIntervalMs() {
  return heartbeatMs;
}

export function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    const comment = formatHeartbeatComment();
    for (const client of clients.values()) {
      try {
        client.res.write(comment);
      } catch (err) {
        logger.warn('sse.heartbeat.write_failed', { clientId: client.id, message: err.message });
        removeClient(client.id);
      }
    }
  }, heartbeatMs);
  if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function nextEventId() {
  seq += 1;
  return String(seq);
}

export function resetEventIdForTests() {
  seq = 0;
}

/**
 * @param {import('express').Response} res
 * @param {{ id: string, role: string, email?: string }} user
 * @param {string[] | null} chantierIds null = unrestricted (admin/administratif)
 * @param {string | null} lastEventId
 */
export function addClient(res, user, chantierIds, lastEventId = null) {
  const id = `sse-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  /** @type {SseClient} */
  const client = {
    id,
    res,
    user,
    chantierIds,
    connectedAt: Date.now(),
    lastEventId: lastEventId ?? null,
  };
  clients.set(id, client);
  startHeartbeat();
  return client;
}

export function removeClient(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  clients.delete(clientId);
  try {
    if (!client.res.writableEnded) client.res.end();
  } catch {
    /* ignore */
  }
  if (clients.size === 0) stopHeartbeat();
}

export function listClients() {
  return [...clients.values()];
}

export function clearClients() {
  for (const id of [...clients.keys()]) removeClient(id);
  stopHeartbeat();
}

/** Write one named SSE event to a client. */
export function writeEvent(client, { id, event, data, retry }) {
  try {
    client.res.write(formatSseMessage({ id, event, data, retry }));
    client.lastEventId = id != null ? String(id) : client.lastEventId;
    return true;
  } catch (err) {
    logger.warn('sse.write_failed', { clientId: client.id, message: err.message });
    removeClient(client.id);
    return false;
  }
}

export function clientCount() {
  return clients.size;
}
