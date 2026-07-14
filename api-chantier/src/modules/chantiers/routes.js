import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', requireRoles('admin', 'administratif'), controller.create);
router.patch('/:id', requireRoles('admin', 'administratif'), controller.update);
router.delete('/:id', requireRoles('admin', 'administratif'), controller.remove);

export default router;
