import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
const reviewers = requireRoles('admin', 'administratif', 'chef_equipe');

router.use(requireAuth);
router.use(reviewers);

router.get('/queue', controller.listQueue);
router.post('/declarations/:id/approve', controller.approve);
router.post('/declarations/:id/reject', controller.reject);
router.post('/declarations/:id/cancel', controller.cancel);
router.post('/periods/:id/decide', controller.decidePeriod);

export default router;
