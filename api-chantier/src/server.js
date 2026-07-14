import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool, pingDatabase } from './shared/db/pool.js';

const app = createApp();

async function start() {
  try {
    const dbOk = await pingDatabase();
    console.log(`[db] ${dbOk ? 'connected' : 'ping failed'}`);
  } catch (err) {
    console.warn(`[db] not reachable yet: ${err.message}`);
    console.warn('[db] server will still start — fix DATABASE_URL when ready');
  }

  const server = app.listen(env.port, () => {
    console.log(`[api-chantier] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`[api-chantier] ${signal} received, shutting down…`);
    server.close(async () => {
      await closePool().catch(() => {});
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[api-chantier] failed to start', err);
  process.exit(1);
});
