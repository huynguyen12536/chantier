import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/', notImplemented('affectations.list'));
router.post('/', notImplemented('affectations.create'));
router.patch('/:id', notImplemented('affectations.update'));

export default router;
