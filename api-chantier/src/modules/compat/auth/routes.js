import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/token', controller.token);
router.post('/logout', controller.logout);
router.get('/user', requireAuth, controller.user);

export default router;
