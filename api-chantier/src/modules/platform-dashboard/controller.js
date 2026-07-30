import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.getPlatformDashboard(req.query));
});
