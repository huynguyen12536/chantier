import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/periods', notImplemented('timesheet.listPeriods'));
router.post('/periods', notImplemented('timesheet.createPeriod'));
router.patch('/periods/:id', notImplemented('timesheet.updatePeriod'));
router.delete('/periods/:id', notImplemented('timesheet.deletePeriod'));
router.get('/declarations', notImplemented('timesheet.listDeclarations'));

export default router;
