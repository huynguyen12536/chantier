import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ logs: await service.listAuditLogs(req.query) });
});
