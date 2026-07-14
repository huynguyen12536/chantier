#!/usr/bin/env node
import { runMigrations, migrationsStatus } from './migrate.js';
import { closePool } from '../shared/db/pool.js';
import { logger } from '../shared/utils/logger.js';

const cmd = process.argv[2] ?? 'up';

async function main() {
  if (cmd === 'status') {
    const status = await migrationsStatus();
    logger.info('migration status', status);
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  if (cmd === 'up') {
    const result = await runMigrations();
    logger.info('migrations complete', result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.error(`Unknown command: ${cmd}. Use: up | status`);
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
