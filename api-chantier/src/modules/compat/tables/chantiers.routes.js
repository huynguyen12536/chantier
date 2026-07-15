import { Router } from 'express';
import { requireAuth, requireRoles } from '../../../shared/middleware/auth.js';
import * as controller from './chantiers.controller.js';

const router = Router();
router.use(requireAuth);

const writers = requireRoles('admin', 'administratif');

router.get('/chantiers', controller.list);
router.get('/chantiers/:id', controller.getById);
router.post('/chantiers', writers, controller.create);
router.patch('/chantiers/:id', writers, controller.update);

export default router;
