import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as usersService from './service.js';

export const list = asyncHandler(async (_req, res) => {
  const users = await usersService.listUsers();
  res.json({ users });
});

export const getById = asyncHandler(async (req, res) => {
  const user = await usersService.getUser(req.params.id);
  res.json({ user });
});

export const create = asyncHandler(async (req, res) => {
  const user = await usersService.createUser(req.body ?? {}, req.user);
  res.status(201).json({ user });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await usersService.deleteUser(req.params.id, req.user);
  res.json(result);
});
