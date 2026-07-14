import { randomUUID } from 'node:crypto';

/**
 * Correlation ID middleware — ADR-001 observability (Imp-01 Platform).
 * Accepts inbound x-correlation-id or generates one; echoes on response.
 */
export function correlationId(req, res, next) {
  const incoming = req.headers['x-correlation-id'];
  const id =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim().slice(0, 128)
      : randomUUID();
  req.correlationId = id;
  res.setHeader('x-correlation-id', id);
  next();
}
