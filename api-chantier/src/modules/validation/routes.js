import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/queue', notImplemented('validation.queue'));
router.post('/declarations/:id/approve', notImplemented('validation.approve'));
router.post('/declarations/:id/reject', notImplemented('validation.reject'));
router.post('/declarations/:id/cancel', notImplemented('validation.cancel'));

export default router;
