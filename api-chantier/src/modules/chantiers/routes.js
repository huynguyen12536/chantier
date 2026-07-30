import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { forbidSystemAdminOperational, blockDisabledCompany } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth, blockDisabledCompany, forbidSystemAdminOperational);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', requireRoles('admin'), controller.create);
router.patch('/:id', requireRoles('admin'), controller.update);
router.delete('/:id', requireRoles('admin'), controller.remove);

export default router;
