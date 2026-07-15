import { JOB_PLATFORM_NOOP } from './jobTypes.js';
import * as platformNoop from './handlers/platformNoop.js';

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

/** Wave A builtins — only platform noop. */
export function registerBuiltinJobs() {
  registerJob(JOB_PLATFORM_NOOP, { handler: platformNoop.handler });
}
