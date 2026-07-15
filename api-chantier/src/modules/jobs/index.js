/**
 * Imp-10 Wave A jobs façade.
 *
 * Ephemeral queue (DR-IMP10-002=A): in-memory only; process restart loses
 * queued/running jobs and idempotency state. No SQL / Redis / outbox.
 */
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';
import {
  bindJobsEnqueueApi,
  unbindJobsEnqueueApi,
} from '../realtime/dispatcher.js';
import { createJobCorrelationId } from './correlation.js';
import * as registry from './registry.js';
import * as queue from './queue.js';
import * as runner from './runner.js';
import { JOB_PLATFORM_NOOP, JOB_REALTIME_REDISPATCH_CATALOG } from './jobTypes.js';

export { JOB_PLATFORM_NOOP, JOB_REALTIME_REDISPATCH_CATALOG };

/**
 * Start Imp-10 in-process job platform (DR-001=A / Wave B1 extends builtins only).
 * No HTTP routes. Domain writes remain Imp-06/07; JB-01 only invokes Imp-09 fan-out.
 * Binds enqueue API into Imp-09 dispatcher for write-failure → JB-01 (DR-B-002=A).
 */
export function startJobs() {
  if (env.jobsEnabled === false) {
    logger.info('jobs.disabled', { reason: 'JOBS_ENABLED=false' });
    unbindJobsEnqueueApi();
    return;
  }
  registry.clearRegistry();
  queue.clear();
  registry.registerBuiltinJobs();
  bindJobsEnqueueApi({
    enqueueJob,
    JOB_REALTIME_REDISPATCH_CATALOG,
  });
  runner.startRunner();
}

export function stopJobs() {
  runner.stopRunner();
  unbindJobsEnqueueApi();
}

/**
 * @param {{ type: string, payload?: object, idempotencyKey: string, correlationId?: string }} input
 */
export function enqueueJob(input = {}) {
  if (env.jobsEnabled === false) {
    const err = new Error('Jobs platform disabled (JOBS_ENABLED=false)');
    err.code = 'JOBS_DISABLED';
    throw err;
  }
  const type = input.type;
  if (!registry.getJob(type)) {
    const err = new Error(`Unknown or unregistered job type: ${type}`);
    err.code = 'JOBS_UNKNOWN_TYPE';
    throw err;
  }

  const correlationId = createJobCorrelationId(input.correlationId);
  const result = queue.enqueue({
    type,
    payload: input.payload ?? {},
    idempotencyKey: input.idempotencyKey,
    correlationId,
    attempt: 0,
  });

  logger.info('jobs.enqueued', {
    correlationId,
    jobId: result.job?.id,
    type,
    idempotencyKey: input.idempotencyKey,
    duplicate: result.duplicate,
  });

  return {
    accepted: true,
    duplicate: result.duplicate,
    jobId: result.job?.id ?? null,
  };
}

export function getJobsStatus() {
  return {
    enabled: env.jobsEnabled !== false,
    types: registry.listJobTypes(),
    runner: runner.getRunnerStats(),
    queue: queue.snapshot(),
    dead: queue.getDead(),
  };
}

/** Test helpers re-export */
export const __test = {
  runOnce: runner.runOnce,
  drain: runner.drain,
  clearQueue: queue.clear,
  clearRegistry: registry.clearRegistry,
  registerJob: registry.registerJob,
  registerBuiltinJobs: registry.registerBuiltinJobs,
  hasCompletedKey: queue.hasCompletedKey,
  hasReservedKey: queue.hasReservedKey,
  getDead: queue.getDead,
  getInFlight: queue.getInFlight,
  isRunning: runner.isRunning,
  startRunner: runner.startRunner,
  stopRunner: runner.stopRunner,
};
