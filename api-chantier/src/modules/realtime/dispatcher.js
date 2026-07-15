/**
 * Realtime dispatcher — maps domain/hook events → scoped SSE fan-out.
 * No persistence / replay (Last-Event-ID acknowledged only).
 */

import { EVENT_TYPES, REVIEW_HOOK_TYPES } from './eventTypes.js';
import { listClients, nextEventId, writeEvent } from './sseRegistry.js';
import { clientMayReceive } from './scope.js';
import { logger } from '../../shared/utils/logger.js';

const DEFAULT_RETRY_MS = 3000;

/**
 * Normalize any Imp-06/07 hook payload into catalog SSE event(s).
 * @param {Record<string, unknown>} raw
 * @returns {Array<{ type: string, entityId?: string, userId?: string|null, chantierId?: string|null, statut?: string|null, actorId?: string|null, action?: string|null, source?: string }>}
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

  /** Already a catalog type from Imp-06 */
  if (catalog.has(t)) {
    const out = [{ type: t, ...base }];
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
      out.push({ type: EVENT_TYPES.QUEUE_CHANGED, ...base, source: 'derived' });
      out.push({ type: EVENT_TYPES.DASHBOARD_CHANGED, ...base, source: 'derived' });
    }
    return out;
  }

  /** Imp-07 producer types → catalog */
  if (t === REVIEW_HOOK_TYPES.DECLARATION_CANCELLED) {
    return [
      { type: EVENT_TYPES.DECLARATION_CANCELLED, ...base, source: 'imp07' },
      { type: EVENT_TYPES.QUEUE_CHANGED, ...base, source: 'derived' },
      { type: EVENT_TYPES.DASHBOARD_CHANGED, ...base, source: 'derived' },
    ];
  }

  if (t === REVIEW_HOOK_TYPES.DECLARATION_REVIEWED) {
    let mapped = EVENT_TYPES.DECLARATION_UPDATED;
    if (base.statut === 'validee') mapped = EVENT_TYPES.DECLARATION_APPROVED;
    else if (base.statut === 'rejetee') mapped = EVENT_TYPES.DECLARATION_REJECTED;
    else if (base.statut === 'annulee') mapped = EVENT_TYPES.DECLARATION_CANCELLED;
    return [
      { type: mapped, ...base, source: 'imp07' },
      { type: EVENT_TYPES.QUEUE_CHANGED, ...base, source: 'derived' },
      { type: EVENT_TYPES.DASHBOARD_CHANGED, ...base, source: 'derived' },
    ];
  }

  if (t === REVIEW_HOOK_TYPES.PERIOD_REVIEWED) {
    return [
      { type: EVENT_TYPES.PERIOD_UPDATED, ...base, source: 'imp07' },
      { type: EVENT_TYPES.DASHBOARD_CHANGED, ...base, source: 'derived' },
      { type: EVENT_TYPES.QUEUE_CHANGED, ...base, source: 'derived' },
    ];
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
    if (writeEvent(client, { id, event: catalogEvent.type, data: payload, retry: DEFAULT_RETRY_MS })) {
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
