import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/payroll', notImplemented('export.payroll'));

export default router;
