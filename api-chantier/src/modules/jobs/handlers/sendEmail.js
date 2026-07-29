import { createHash } from 'node:crypto';
import { logger } from '../../../shared/utils/logger.js';
import * as mailService from '../../mail/service.js';

/**
 * Worker handler — sends queued emails (never called from FE).
 */
export async function handler({ correlationId, job } = {}) {
  const payload = job?.payload ?? {};
  logger.info('jobs.mail.send.start', {
    correlationId,
    jobId: job?.id,
    to: payload.to,
    template: payload.template,
  });
  await mailService.sendMail(payload);
}
