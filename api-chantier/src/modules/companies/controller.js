import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (_req, res) => {
  res.json({ companies: await service.listCompanies() });
});

export const getById = asyncHandler(async (req, res) => {
  res.json({ company: await service.getCompany(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const company = await service.createCompany(req.body ?? {}, req.user);
  res.status(201).json({ company });
});

export const update = asyncHandler(async (req, res) => {
  const company = await service.updateCompany(req.params.id, req.body ?? {}, req.user);
  res.json({ company });
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await service.deleteCompany(req.params.id, req.user));
});

export const stats = asyncHandler(async (req, res) => {
  res.json(await service.getCompanyStats(req.params.id));
});

export const getSettings = asyncHandler(async (req, res) => {
  res.json(await service.getCompanySettings(req.params.id, req.user));
});

export const patchSettings = asyncHandler(async (req, res) => {
  const company = await service.updateCompanySettings(req.params.id, req.body ?? {}, req.user);
  res.json({ company });
});

export const getMySettings = asyncHandler(async (req, res) => {
  res.json(await service.getOwnCompanySettings(req.user));
});

export const patchMySettings = asyncHandler(async (req, res) => {
  const company = await service.updateOwnCompanySettings(req.body ?? {}, req.user);
  res.json({ company });
});
