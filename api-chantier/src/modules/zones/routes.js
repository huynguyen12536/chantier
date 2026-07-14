import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
/** CVL: admin + chef_equipe only (administratif has no zone admin policies) */
const zoneWriters = requireRoles('admin', 'chef_equipe');

router.use(requireAuth);

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
