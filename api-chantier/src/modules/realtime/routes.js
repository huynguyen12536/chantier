/**
 * GET /events — Server-Sent Events (DR-IMP09-001).
 */

import { Router } from 'express';
import { requireAuthAllowQueryToken } from '../../shared/middleware/auth.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getChefChantierIds } from '../../shared/authz/chefScope.js';
import { addClient, removeClient } from './sseRegistry.js';
import { formatSseMessage } from './serializer.js';

const router = Router();

async function resolveChantierScope(user) {
  if (['admin', 'administratif'].includes(user.role)) return null;
  if (user.role === 'chef_equipe') return getChefChantierIds(user.id);
  return [];
}

router.get(
  '/',
  requireAuthAllowQueryToken,
  asyncHandler(async (req, res) => {
    const lastEventId =
      req.headers['last-event-id'] != null
        ? String(req.headers['last-event-id'])
        : req.query.lastEventId
          ? String(req.query.lastEventId)
          : null;

    const chantierIds = await resolveChantierScope(req.user);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const client = addClient(res, req.user, chantierIds, lastEventId);

    res.write(
      formatSseMessage({
        event: 'connected',
        data: {
          type: 'connected',
          clientId: client.id,
          userId: req.user.id,
          role: req.user.role,
          lastEventId,
          at: new Date().toISOString(),
        },
        retry: 3000,
      }),
    );

    const onClose = () => {
      removeClient(client.id);
      req.off?.('close', onClose);
      res.off?.('close', onClose);
    };
    req.on('close', onClose);
    res.on('close', onClose);
  }),
);

export default router;
