import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import { requireSystemAdmin } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const router = Router();
router.use(requireAuth, requireSystemAdmin);
router.get('/', controller.dashboard);

export default router;
