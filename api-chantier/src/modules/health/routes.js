import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { pingDatabase } from '../../shared/db/pool.js';
import { migrationsStatus } from '../../db/migrate.js';

const router = Router();

/** Liveness — process is up (no DB dependency). */
router.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    check: 'live',
    service: 'api-chantier',
    timestamp: new Date().toISOString(),
  });
});

/** Readiness — DB reachable. */
router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    let database = 'down';
    try {
      database = (await pingDatabase()) ? 'up' : 'down';
    } catch {
      database = 'down';
    }
    const ready = database === 'up';
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'not_ready',
      check: 'ready',
      service: 'api-chantier',
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Aggregate health (compat with existing scaffold consumers).
 * 200 only when DB up; otherwise 503 degraded.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let database = 'unknown';
    try {
      database = (await pingDatabase()) ? 'up' : 'down';
    } catch {
      database = 'down';
    }

    let migrations = null;
    if (database === 'up') {
      try {
        migrations = await migrationsStatus();
      } catch {
        migrations = { error: 'unavailable' };
      }
    }

    const healthy = database === 'up';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'api-chantier',
      wave: '2',
      module: 'infrastructure',
      database,
      migrations,
      checks: {
        live: 'ok',
        ready: healthy ? 'ok' : 'fail',
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
