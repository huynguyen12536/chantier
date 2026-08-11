import { logger } from '../../../shared/utils/logger.js';
import { cleanupExpiredChantiersDivers } from '../../chantiers/diversService.js';

export async function handler({ correlationId, job } = {}) {
  const processed = await cleanupExpiredChantiersDivers();
  logger.info('jobs.cleanup_expired_divers.done', {
    correlationId,
    jobId: job?.id,
    processed,
  });
  return { processed };
}
