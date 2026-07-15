import { JOB_PLATFORM_NOOP, JOB_REALTIME_REDISPATCH_CATALOG } from './jobTypes.js';
import * as platformNoop from './handlers/platformNoop.js';
import * as realtimeRedispatch from './handlers/realtimeRedispatch.js';

/** @type {Map<string, { handler: Function, maxAttempts?: number }>} */
const jobs = new Map();

export function registerJob(type, def) {
  if (!type || typeof type !== 'string') {
    throw new Error('job type required');
  }
  if (!def || typeof def.handler !== 'function') {
    throw new Error('job handler required');
  }
  jobs.set(type, { handler: def.handler, maxAttempts: def.maxAttempts });
}

export function getJob(type) {
  return jobs.get(type) ?? null;
}

export function listJobTypes() {
  return [...jobs.keys()];
}

export function clearRegistry() {
  jobs.clear();
}

/** Builtins: Wave A platform_noop + Wave B1 JB-01 redispatch. */
export function registerBuiltinJobs() {
  registerJob(JOB_PLATFORM_NOOP, { handler: platformNoop.handler });
  registerJob(JOB_REALTIME_REDISPATCH_CATALOG, { handler: realtimeRedispatch.handler });
}
