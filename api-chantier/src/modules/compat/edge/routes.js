import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.options('/create-user', controller.options);
router.options('/delete-user', controller.options);

router.post('/create-user', requireAuth, controller.createUser);
router.post('/delete-user', requireAuth, controller.deleteUser);

export default router;
