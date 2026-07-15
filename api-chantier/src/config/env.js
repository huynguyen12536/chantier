import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/chantier'),
  jwtSecret: required('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshExpiresMs: Number(process.env.REFRESH_EXPIRES_MS ?? String(7 * 24 * 60 * 60 * 1000)),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  /** Imp-09 SSE heartbeat interval (ms). Default 30000. */
  sseHeartbeatMs: Number(process.env.SSE_HEARTBEAT_MS ?? 30_000),
  /** Imp-09 SSE `retry:` hint for clients (ms). Default 3000. */
  sseRetryMs: Number(process.env.SSE_RETRY_MS ?? 3_000),
  /** Imp-10 Wave A — in-process jobs (default enabled). */
  jobsEnabled: (process.env.JOBS_ENABLED ?? 'true').toLowerCase() !== 'false',
  jobsPollMs: Number(process.env.JOBS_POLL_MS ?? 50),
  jobsMaxAttempts: Number(process.env.JOBS_MAX_ATTEMPTS ?? 3),
  jobsBackoffCapMs: Number(process.env.JOBS_BACKOFF_CAP_MS ?? 2000),
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  isTest: (process.env.NODE_ENV ?? 'development') === 'test',
};
