import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './periodes.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/periodes_travail', controller.listPeriods);
router.post('/periodes_travail', controller.createPeriod);
router.patch('/periodes_travail/:id', controller.updatePeriod);
router.delete('/periodes_travail/:id', controller.deletePeriod);

router.get('/declarations_heures', controller.listDeclarations);

export default router;
