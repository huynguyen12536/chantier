import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  const affectations = await service.listAffectations(req.query.chantier_id);
  res.json({ affectations });
});

export const create = asyncHandler(async (req, res) => {
  const affectation = await service.assignUser(req.body ?? {}, req.user);
  res.status(201).json({ affectation });
});

export const softRemove = asyncHandler(async (req, res) => {
  const affectation = await service.softRemoveAffectation(req.params.id, req.user);
  res.json({ affectation });
});
