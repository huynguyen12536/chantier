import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as aff from '../affectations/service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ zones: await aff.listZones() });
  }),
);

router.post(
  '/',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  asyncHandler(async (req, res) => {
    const zone = await aff.createZone(req.body ?? {}, req.user);
    res.status(201).json({ zone });
  }),
);

router.post(
  '/:id/chantiers',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  asyncHandler(async (req, res) => {
    const link = await aff.linkZoneChantier(req.params.id, req.body.chantier_id, req.user);
    res.status(201).json({ link });
  }),
);

router.post(
  '/:id/ouvriers',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  asyncHandler(async (req, res) => {
    const member = await aff.addZoneOuvrier(req.params.id, req.body.user_id, req.user);
    res.status(201).json({ member });
  }),
);

export default router;
