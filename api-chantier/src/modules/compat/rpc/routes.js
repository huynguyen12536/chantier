import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/delete_chantier_cascade', requireAuth, controller.deleteChantierCascade);

export default router;
