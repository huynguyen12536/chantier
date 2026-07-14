import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './services/timesheetService.js';

export const createPeriod = asyncHandler(async (req, res) => {
  const result = await service.createPeriod(req.body ?? {}, req.user);
  res.status(201).json(result);
});

export const updatePeriod = asyncHandler(async (req, res) => {
  const result = await service.updatePeriod(req.params.id, req.body ?? {}, req.user);
  res.json(result);
});

export const deletePeriod = asyncHandler(async (req, res) => {
  const result = await service.deletePeriod(req.params.id, req.user);
  res.json(result);
});

export const listPeriods = asyncHandler(async (req, res) => {
  const periods = await service.listPeriods(req.query, req.user);
  res.json({ periods });
});

export const listDeclarations = asyncHandler(async (req, res) => {
  const declarations = await service.listDeclarations(req.query, req.user);
  res.json({ declarations });
});

export const decideDeclaration = asyncHandler(async (req, res) => {
  const result = await service.decideDeclaration(req.params.id, req.body ?? {}, req.user);
  res.json(result);
});
