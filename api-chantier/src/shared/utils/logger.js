/**
 * Minimal structured logger with optional correlation id.
 * Imp-01 — no external logging dependency.
 */
export function createLogger(scope = 'api') {
  function line(level, message, meta = {}) {
    const payload = {
      ts: new Date().toISOString(),
      level,
      scope,
      message,
      ...meta,
    };
    const text = JSON.stringify(payload);
    if (level === 'error') console.error(text);
    else if (level === 'warn') console.warn(text);
    else console.log(text);
  }

  return {
    info: (message, meta) => line('info', message, meta),
    warn: (message, meta) => line('warn', message, meta),
    error: (message, meta) => line('error', message, meta),
  };
}

export const logger = createLogger('api-chantier');
