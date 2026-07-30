import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { forbidSystemAdminOperational, blockDisabledCompany } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth, blockDisabledCompany, forbidSystemAdminOperational);

router.get('/periods', controller.listPeriods);
router.post('/periods', controller.createPeriod);
router.patch('/periods/:id', controller.updatePeriod);
router.delete('/periods/:id', controller.deletePeriod);

router.get('/declarations', controller.listDeclarations);
router.post(
  '/declarations/:id/decide',
  requireRoles('admin', 'administratif', 'chef_equipe'),
  controller.decideDeclaration,
);

export default router;
