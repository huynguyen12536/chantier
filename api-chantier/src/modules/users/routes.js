import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'administratif'), controller.list);
router.get('/:id', requireRoles('admin', 'administratif'), controller.getById);
router.post('/', requireRoles('admin', 'administratif'), controller.create);
router.patch('/:id', requireRoles('admin'), controller.update);
router.delete('/:id', requireRoles('admin'), controller.remove);

export default router;
