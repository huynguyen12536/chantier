import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/', notImplemented('users.list'));
router.post('/', notImplemented('users.create'));
router.get('/:id', notImplemented('users.get'));
router.patch('/:id', notImplemented('users.update'));
router.delete('/:id', notImplemented('users.delete'));

export default router;
