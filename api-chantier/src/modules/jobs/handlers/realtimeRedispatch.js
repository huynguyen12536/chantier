/**
 * JB-01 — Imp-10 Wave B1 thin adapter.
 * Re-invokes Imp-09 catalog fan-out only. No domain mutations, SQL, or SSE rewrite.
 */
import { logger } from '../../../shared/utils/logger.js';
import { dispatchCatalogEvent } from '../../realtime/dispatcher.js';
import { JOB_REALTIME_REDISPATCH_CATALOG } from '../jobTypes.js';

/**
 * @param {{ correlationId?: string, job?: { id?: string, attempt?: number, idempotencyKey?: string, payload?: object } }} ctx
 */
export async function handler({ correlationId, job } = {}) {
  const payload = job?.payload ?? {};
  const catalogEvent = payload.catalogEvent;

  if (!catalogEvent || typeof catalogEvent !== 'object' || !catalogEvent.type) {
    const err = new Error('jobs.realtime.redispatch_catalog requires payload.catalogEvent.type');
    err.code = 'JOBS_INVALID_PAYLOAD';
    throw err;
  }

  const result = dispatchCatalogEvent(catalogEvent);

  logger.info('jobs.realtime.redispatch_catalog.done', {
    correlationId,
    jobId: job?.id,
    type: JOB_REALTIME_REDISPATCH_CATALOG,
    attempt: job?.attempt,
    idempotencyKey: job?.idempotencyKey,
    catalogType: catalogEvent.type,
    dispatchedId: result?.id ?? null,
    delivered: result?.delivered ?? 0,
  });

  return result;
}
