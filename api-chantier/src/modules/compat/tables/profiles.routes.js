import { Router } from 'express';
import { requireAuth, requireRoles } from '../../../shared/middleware/auth.js';
import * as controller from './profiles.controller.js';

const router = Router();

router.use(requireAuth);

/**
 * Phase 13 cutover: admin/administratif list (Imp-03);
 * chef_equipe read for FE embeds (validation/team) — transport scope only.
 * Self GET always allowed via controller.
 */
const listReaders = requireRoles('admin', 'administratif', 'chef_equipe');

router.get('/profiles', listReaders, controller.listProfiles);
router.get('/profiles/:id', controller.getProfileSelfOrAdmin);
router.patch('/profiles', controller.patchProfile);
router.patch('/profiles/:id', controller.patchProfile);

export default router;
