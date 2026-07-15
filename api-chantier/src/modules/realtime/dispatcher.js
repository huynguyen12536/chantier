/**
 * Realtime dispatcher — maps domain/hook events → scoped SSE fan-out.
 *
 * Last-Event-ID: accepted on connect for client acknowledgment only.
 * Server does NOT replay missed events (no persistence).
 */

import { env } from '../../config/env.js';
import { EVENT_TYPES, REVIEW_HOOK_TYPES } from './eventTypes.js';
import { listClients, nextEventId, writeEvent } from './sseRegistry.js';
import { clientMayReceive } from './scope.js';
import { logger } from '../../shared/utils/logger.js';

/** Who synthesized the secondary UI refresh signal. */
const SOURCE_DISPATCHER_QUEUE = 'dispatcher.queue_changed';
const SOURCE_DISPATCHER_DASHBOARD = 'dispatcher.dashboard_changed';

let retryMs = Number(env.sseRetryMs) || 3_000;

export function setRetryMs(ms) {
  retryMs = Math.max(0, Number(ms) || 3_000);
}

export function getRetryMs() {
  return retryMs;
}

/**
 * After a primary domain/catalog event, Imp-09 dispatcher also emits
 * queue.changed + dashboard.changed so validation / chef-dashboard can reload.
 * Producers (Imp-06/07) do not emit these two types themselves.
 */
function withUiRefreshSignals(primary, base) {
  return [
    primary,
    { type: EVENT_TYPES.QUEUE_CHANGED, ...base, source: SOURCE_DISPATCHER_QUEUE },
    { type: EVENT_TYPES.DASHBOARD_CHANGED, ...base, source: SOURCE_DISPATCHER_DASHBOARD },
  ];
}

/**
 * Normalize any Imp-06/07 hook payload into catalog SSE event(s).
 * @param {Record<string, unknown>} raw
 */
export function expandToCatalogEvents(raw) {
  if (!raw || typeof raw !== 'object' || !raw.type) return [];

  const base = {
    entityId: raw.entityId ?? raw.entity_id ?? null,
    userId: raw.userId ?? raw.user_id ?? null,
    chantierId: raw.chantierId ?? raw.chantier_id ?? null,
    statut: raw.statut ?? null,
    actorId: raw.actorId ?? raw.actor_id ?? null,
    action: raw.action ?? null,
    source: raw.source ?? 'domain',
  };

  const t = String(raw.type);
  const catalog = new Set(Object.values(EVENT_TYPES));

  /** Already a catalog type from Imp-06 (or direct dispatch) */
  if (catalog.has(t)) {
    if (
      t === EVENT_TYPES.QUEUE_CHANGED ||
      t === EVENT_TYPES.DASHBOARD_CHANGED
    ) {
      return [{ type: t, ...base }];
    }
    if (
      [
        EVENT_TYPES.PERIOD_CREATED,
        EVENT_TYPES.PERIOD_UPDATED,
        EVENT_TYPES.PERIOD_DELETED,
        EVENT_TYPES.DECLARATION_SUBMITTED,
        EVENT_TYPES.DECLARATION_UPDATED,
        EVENT_TYPES.DECLARATION_APPROVED,
        EVENT_TYPES.DECLARATION_REJECTED,
        EVENT_TYPES.DECLARATION_CANCELLED,
      ].includes(t)
    ) {
      return withUiRefreshSignals({ type: t, ...base }, base);
    }
    return [{ type: t, ...base }];
  }

  /** Imp-07 producer types → catalog + UI refresh signals */
  if (t === REVIEW_HOOK_TYPES.DECLARATION_CANCELLED) {
    return withUiRefreshSignals(
      { type: EVENT_TYPES.DECLARATION_CANCELLED, ...base, source: 'imp07' },
      { ...base, source: 'imp07' },
    );
  }

  if (t === REVIEW_HOOK_TYPES.DECLARATION_REVIEWED) {
    let mapped = EVENT_TYPES.DECLARATION_UPDATED;
    if (base.statut === 'validee') mapped = EVENT_TYPES.DECLARATION_APPROVED;
    else if (base.statut === 'rejetee') mapped = EVENT_TYPES.DECLARATION_REJECTED;
    else if (base.statut === 'annulee') mapped = EVENT_TYPES.DECLARATION_CANCELLED;
    return withUiRefreshSignals(
      { type: mapped, ...base, source: 'imp07' },
      { ...base, source: 'imp07' },
    );
  }

  if (t === REVIEW_HOOK_TYPES.PERIOD_REVIEWED) {
    return withUiRefreshSignals(
      { type: EVENT_TYPES.PERIOD_UPDATED, ...base, source: 'imp07' },
      { ...base, source: 'imp07' },
    );
  }

  logger.warn('realtime.unknown_event_type', { type: t });
  return [];
}

/**
 * Fan-out one catalog event to scoped SSE clients.
 * @param {Record<string, unknown>} catalogEvent
 */
export function dispatchCatalogEvent(catalogEvent) {
  const id = nextEventId();
  const payload = {
    type: catalogEvent.type,
    entityId: catalogEvent.entityId ?? null,
    userId: catalogEvent.userId ?? null,
    chantierId: catalogEvent.chantierId ?? null,
    statut: catalogEvent.statut ?? null,
    actorId: catalogEvent.actorId ?? null,
    action: catalogEvent.action ?? null,
    source: catalogEvent.source ?? 'domain',
    at: new Date().toISOString(),
    id,
  };

  let delivered = 0;
  for (const client of listClients()) {
    if (!clientMayReceive(client.user, client.chantierIds, payload)) continue;
    if (writeEvent(client, { id, event: catalogEvent.type, data: payload, retry: retryMs })) {
      delivered += 1;
    }
  }
  return { id, delivered };
}

/**
 * Entry from notificationHooks / Imp-06 — expand then dispatch.
 * Never throws.
 * @param {Record<string, unknown>} raw
 */
export function dispatchDomainEvent(raw) {
  try {
    const events = expandToCatalogEvents(raw);
    const results = [];
    for (const ev of events) {
      results.push(dispatchCatalogEvent(ev));
    }
    return results;
  } catch (err) {
    logger.error('realtime.dispatch_failed', { message: err.message });
    return [];
  }
}
