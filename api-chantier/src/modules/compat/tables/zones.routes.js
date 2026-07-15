import { Router } from 'express';
import { requireAuth, requireRoles } from '../../../shared/middleware/auth.js';
import * as controller from './zones.controller.js';

const router = Router();
router.use(requireAuth);

const writers = requireRoles('admin', 'chef_equipe');

router.get('/zones_equipe', controller.listZones);
router.post('/zones_equipe', writers, controller.createZone);
router.patch('/zones_equipe/:id', writers, controller.updateZone);
router.delete('/zones_equipe/:id', writers, controller.deleteZone);

router.get('/zones_chantiers', controller.listZoneChantiers);
router.post('/zones_chantiers', writers, controller.linkChantier);
router.delete(
  '/zones_chantiers/:zoneId/:chantierId',
  writers,
  controller.unlinkChantier,
);
router.delete('/zones_chantiers', writers, controller.unlinkChantier);

router.get('/zones_ouvriers', controller.listZoneOuvriers);
router.post('/zones_ouvriers', writers, controller.addOuvrier);
router.patch('/zones_ouvriers', writers, controller.patchOuvrier);
router.patch('/zones_ouvriers/:zoneId/:userId', writers, controller.patchOuvrier);

export default router;
