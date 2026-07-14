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
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  isTest: (process.env.NODE_ENV ?? 'development') === 'test',
};
