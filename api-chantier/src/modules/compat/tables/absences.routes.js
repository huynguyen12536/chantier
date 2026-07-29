import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './absences.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/absences', controller.list);
router.get('/absences/:id', controller.getById);
router.post('/absences', controller.create);
router.patch('/absences/:id', controller.update);
router.delete('/absences/:id', controller.remove);

export default router;
