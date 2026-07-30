import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import { requireSystemAdmin } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();
router.use(requireAuth, requireSystemAdmin);

router.get('/', controller.list);
router.post('/company-admins', controller.createAdmin);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/reset-password', controller.resetPassword);
router.post('/:id/lock', controller.lock);
router.post('/:id/unlock', controller.unlock);

export default router;
