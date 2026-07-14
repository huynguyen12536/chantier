import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/', notImplemented('chantiers.list'));
router.post('/', notImplemented('chantiers.create'));
router.get('/:id', notImplemented('chantiers.get'));
router.patch('/:id', notImplemented('chantiers.update'));
router.delete('/:id', notImplemented('chantiers.deleteCascade'));

export default router;
