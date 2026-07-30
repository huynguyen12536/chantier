import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ users: await service.listUsersForMonitoring(req.user, req.query) });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const user = await service.createCompanyAdmin(req.body ?? {}, req.user);
  res.status(201).json({ user });
});

export const resetPassword = asyncHandler(async (req, res) => {
  res.json(await service.resetCompanyAdminPassword(req.params.id, req.body ?? {}, req.user));
});

export const lock = asyncHandler(async (req, res) => {
  res.json({ user: await service.lockCompanyAdmin(req.params.id, req.user, false) });
});

export const unlock = asyncHandler(async (req, res) => {
  res.json({ user: await service.lockCompanyAdmin(req.params.id, req.user, true) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ user: await service.updateCompanyAdmin(req.params.id, req.body ?? {}, req.user) });
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await service.deleteCompanyAdmin(req.params.id, req.user));
});
