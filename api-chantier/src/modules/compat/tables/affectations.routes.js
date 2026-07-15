import { Router } from 'express';
import { requireAuth, requireRoles } from '../../../shared/middleware/auth.js';
import * as controller from './affectations.controller.js';

const router = Router();
router.use(requireAuth);

const writers = requireRoles('admin', 'administratif', 'chef_equipe');

router.get('/affectations_chantiers', controller.list);
router.post('/affectations_chantiers', writers, controller.create);
router.patch('/affectations_chantiers/:id', writers, controller.update);

export default router;
