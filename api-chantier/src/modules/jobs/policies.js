import { env } from '../../config/env.js';

export function getMaxAttempts() {
  const n = Number(env.jobsMaxAttempts);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 3;
}

export function getBackoffCapMs() {
  const n = Number(env.jobsBackoffCapMs);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 2000;
}

/**
 * Exponential backoff: 100 * 2^(attempt-1) ms, capped.
 * @param {number} attempt 1-based attempt about to run after a failure (or next try number)
 */
export function computeBackoffMs(attempt) {
  const a = Math.max(1, Number(attempt) || 1);
  const raw = 100 * 2 ** (a - 1);
  return Math.min(raw, getBackoffCapMs());
}

/**
 * @param {unknown} err
 * @param {number} attempt 0-based attempt index that just failed (0 = first try)
 * @param {number} [maxAttempts]
 */
export function shouldRetry(err, attempt, maxAttempts = getMaxAttempts()) {
  if (err && typeof err === 'object' && err.nonRetryable === true) {
    return false;
  }
  return attempt + 1 < maxAttempts;
}

export function normalizeIdempotencyKey(key) {
  if (typeof key !== 'string') return '';
  return key.trim();
}
