import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { forbidSystemAdminOperational, blockDisabledCompany } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();
router.use(requireAuth, blockDisabledCompany, forbidSystemAdminOperational);

router.get('/', controller.list);
router.post(
  '/',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  controller.create,
);
router.patch(
  '/:id/soft-remove',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  controller.softRemove,
);

export default router;
