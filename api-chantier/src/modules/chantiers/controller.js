import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (_req, res) => {
  res.json({ chantiers: await service.listChantiers() });
});

export const getById = asyncHandler(async (req, res) => {
  res.json({ chantier: await service.getChantier(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const chantier = await service.createChantier(req.body ?? {}, req.user);
  res.status(201).json({ chantier });
});

export const update = asyncHandler(async (req, res) => {
  const chantier = await service.updateChantier(req.params.id, req.body ?? {}, req.user);
  res.json({ chantier });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteChantierCascade(req.params.id, req.user);
  res.json(result);
});
