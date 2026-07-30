import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { forbidSystemAdminOperational, blockDisabledCompany } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();
const zoneWriters = requireRoles('admin', 'chef_equipe');

router.use(requireAuth, blockDisabledCompany, forbidSystemAdminOperational);

router.get('/', controller.list);
router.post('/', zoneWriters, controller.create);
router.patch('/:id', zoneWriters, controller.update);
router.delete('/:id', zoneWriters, controller.remove);

router.post('/:id/chantiers', zoneWriters, controller.linkChantier);
router.delete('/:id/chantiers/:chantierId', zoneWriters, controller.unlinkChantier);

router.post('/:id/ouvriers', zoneWriters, controller.addOuvrier);
router.patch(
  '/:id/ouvriers/:userId/soft-remove',
  zoneWriters,
  controller.softRemoveOuvrier,
);
router.delete('/:id/ouvriers/:userId', zoneWriters, controller.unlinkOuvrier);

export default router;
