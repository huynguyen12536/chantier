import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/delete_chantier_cascade', requireAuth, controller.deleteChantierCascade);
router.post('/create_chantier_divers', requireAuth, controller.rpcDispatch);
router.post('/approve_chantier_divers', requireAuth, controller.rpcDispatch);
router.post('/reject_chantier_divers', requireAuth, controller.rpcDispatch);
router.post('/get_collaborator_divers_notifications', requireAuth, controller.rpcDispatch);
router.post('/validate_declaration_unlock_divers', requireAuth, controller.rpcDispatch);

export default router;
