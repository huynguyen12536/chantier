import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const payroll = asyncHandler(async (req, res) => {
  const result = await service.listPayrollPeriods(req.query, req.user);
  res.json(result);
});

export const stats = asyncHandler(async (req, res) => {
  const result = await service.listExportStats(req.user);
  res.json(result);
});

export const userDeclarations = asyncHandler(async (req, res) => {
  const result = await service.listUserDeclarations(req.query, req.user);
  res.json(result);
});
