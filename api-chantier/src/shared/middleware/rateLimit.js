/**
 * Simple in-memory sliding-window rate limiter (per key).
 * Suitable for single-process API; reset on restart.
 */

/** @type {Map<string, number[]>} */
const buckets = new Map();

/**
 * @param {string} key
 * @param {{ windowMs?: number, max?: number }} opts
 */
export function checkRateLimit(key, opts = {}) {
  const windowMs = opts.windowMs ?? 15 * 60 * 1000;
  const max = opts.max ?? 3;
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= max) {
    const retryAfterMs = hits[0] + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterMs: 0 };
}

/** Test helper */
export function clearRateLimits() {
  buckets.clear();
}

/**
 * Express middleware factory.
 * @param {{ windowMs?: number, max?: number, keyFn?: (req: import('express').Request) => string }} opts
 */
export function rateLimitMiddleware(opts = {}) {
  const keyFn = opts.keyFn ?? ((req) => req.ip ?? 'unknown');
  return (req, res, next) => {
    const key = keyFn(req);
    const result = checkRateLimit(key, opts);
    if (!result.allowed) {
      res.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfterMs: result.retryAfterMs,
      });
    }
    return next();
  };
}
