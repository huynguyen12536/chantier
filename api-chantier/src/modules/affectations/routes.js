import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', controller.list);
router.post('/', requireRoles('admin', 'administratif'), controller.create);
router.patch('/:id/soft-remove', requireRoles('admin', 'administratif'), controller.softRemove);
export default router;
