import { randomUUID } from 'node:crypto';

/**
 * Job correlation id — Imp-01 observability parity for non-HTTP work.
 * Does not depend on Express req.
 */
export function createJobCorrelationId(existing) {
  if (typeof existing === 'string' && existing.trim()) {
    return existing.trim().slice(0, 128);
  }
  return randomUUID();
}
