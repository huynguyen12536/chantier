import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as usersService from '../../users/service.js';
import * as profileMapper from '../mappers/profileMapper.js';

export const listProfiles = asyncHandler(async (req, res) => {
  try {
    if (req.query?.id) {
      const user = await usersService.getUser(String(req.query.id));
      const mapped = profileMapper.toListResponse([user]);
      res.status(mapped.status).json(mapped.body);
      return;
    }
    const users = await usersService.listUsers();
    const mapped = profileMapper.toListResponse(users);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await usersService.getUser(req.params.id);
    const mapped = profileMapper.toOneResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const patchProfile = asyncHandler(async (req, res) => {
  try {
    const { id, patch } = profileMapper.fromPatchRequest(req.params, req.body);
    if (!id) {
      throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    }
    const user = await usersService.updateUser(id, patch, req.user);
    const mapped = profileMapper.toPatchResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
