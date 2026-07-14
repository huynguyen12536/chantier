import { Router } from 'express';
import { notImplemented } from '../../shared/utils/notImplemented.js';

const router = Router();

router.get('/', notImplemented('zones.list'));
router.post('/', notImplemented('zones.create'));
router.delete('/:id', notImplemented('zones.delete'));
router.post('/:id/chantiers', notImplemented('zones.linkChantiers'));
router.post('/:id/ouvriers', notImplemented('zones.linkOuvriers'));

export default router;
