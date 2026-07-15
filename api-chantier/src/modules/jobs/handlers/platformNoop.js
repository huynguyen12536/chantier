import { logger } from '../../../shared/utils/logger.js';
import { JOB_PLATFORM_NOOP } from '../jobTypes.js';

/**
 * Side-effect-free platform job (DR-IMP10-005=A).
 * Must NOT call domain modules, DB, or SSE.
 */
export async function handler({ correlationId, job } = {}) {
  logger.info('jobs.platform_noop.tick', {
    correlationId,
    jobId: job?.id,
    type: JOB_PLATFORM_NOOP,
    attempt: job?.attempt,
    idempotencyKey: job?.idempotencyKey,
  });
}
