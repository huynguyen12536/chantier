import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.post('/login', notImplemented('auth.login'));
router.post('/logout', notImplemented('auth.logout'));
router.get('/me', notImplemented('auth.me'));

export default router;
