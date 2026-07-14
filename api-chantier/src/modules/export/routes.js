import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
const exporters = requireRoles('admin', 'administratif', 'chef_equipe');

router.use(requireAuth);
router.use(exporters);

router.get('/payroll', controller.payroll);
router.get('/stats', controller.stats);

export default router;
