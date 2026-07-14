import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { pingDatabase } from '../../shared/db/pool.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let database = 'unknown';
    try {
      database = (await pingDatabase()) ? 'up' : 'down';
    } catch {
      database = 'down';
    }

    const healthy = database === 'up';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'api-chantier',
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
