import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export default router;
