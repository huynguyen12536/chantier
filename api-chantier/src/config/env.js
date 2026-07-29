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
  /** Public app URL for password-reset links */
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:16035',
  /** MinIO object storage */
  minioEnabled: (process.env.MINIO_ENABLED ?? 'true').toLowerCase() !== 'false',
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'minio',
  minioPort: Number(process.env.MINIO_PORT ?? 9000),
  minioUseSsl: (process.env.MINIO_USE_SSL ?? 'false').toLowerCase() === 'true',
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET ?? 'chantier-assets',
  minioRegion: process.env.MINIO_REGION ?? 'us-east-1',
  minioPublicHost: process.env.MINIO_PUBLIC_HOST ?? '',
  /** SMTP (optional — log-only when unset) */
  smtpHost: process.env.SMTP_HOST ?? process.env.MAIL_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? process.env.MAIL_PORT ?? 587),
  smtpSecure:
    (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true'
    || Number(process.env.SMTP_PORT ?? process.env.MAIL_PORT ?? 587) === 465,
  smtpUser: process.env.SMTP_USER ?? process.env.MAIL_USERNAME ?? '',
  smtpPass: process.env.SMTP_PASS ?? process.env.MAIL_PASSWORD ?? '',
  smtpFromName: process.env.SMTP_FROM_NAME ?? process.env.MAIL_FROM_NAME ?? 'Tubesca 3D',
  smtpFrom:
    process.env.SMTP_FROM
    ?? process.env.MAIL_FROM_EMAIL
    ?? 'noreply@chantier.local',
  otpSecret: process.env.OTP_SECRET ?? process.env.JWT_SECRET ?? 'dev-only-change-me',
  minioAvatarBucket: process.env.MINIO_AVATAR_BUCKET ?? 'avatars',
};
