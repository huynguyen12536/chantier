import { Router } from 'express';
import { requireAuth, requireRoles } from '../../../shared/middleware/auth.js';
import * as controller from './profiles.controller.js';

const router = Router();

router.use(requireAuth);

/** Mirror Imp-03 GET /api/users role gate (no new permissions). */
const readers = requireRoles('admin', 'administratif');

router.get('/profiles', readers, controller.listProfiles);
router.get('/profiles/:id', readers, controller.getProfile);
router.patch('/profiles', controller.patchProfile);
router.patch('/profiles/:id', controller.patchProfile);

export default router;
