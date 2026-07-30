import { Router } from 'express';
import { requireAuth, requireRoles } from '../../shared/middleware/auth.js';
import { requireSystemAdmin, blockDisabledCompany } from '../../shared/middleware/tenant.js';
import * as controller from './controller.js';

const platformRouter = Router();
platformRouter.use(requireAuth, requireSystemAdmin);
platformRouter.get('/', controller.list);
platformRouter.post('/', controller.create);
platformRouter.get('/:id', controller.getById);
platformRouter.patch('/:id', controller.update);
platformRouter.delete('/:id', controller.remove);
platformRouter.get('/:id/stats', controller.stats);
platformRouter.get('/:id/settings', controller.getSettings);

const tenantRouter = Router();
tenantRouter.use(requireAuth, blockDisabledCompany);
tenantRouter.get('/settings', requireRoles('admin'), controller.getMySettings);
tenantRouter.patch('/settings', requireRoles('admin'), controller.patchMySettings);

export { platformRouter, tenantRouter };
