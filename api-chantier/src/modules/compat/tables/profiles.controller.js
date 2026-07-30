import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as usersService from '../../users/service.js';
import * as profileMapper from '../mappers/profileMapper.js';

export const listProfiles = asyncHandler(async (req, res) => {
  try {
    if (req.query?.id) {
      const user = await usersService.getUser(String(req.query.id), req.user);
      const mapped = profileMapper.toListResponse([user]);
      res.status(mapped.status).json(mapped.body);
      return;
    }
    let users = await usersService.listUsers(req.user);
    const role = req.query?.role;
    if (role) {
      users = users.filter((u) => u.role === String(role));
    }
    const roleIn = req.query?.role_in;
    if (roleIn) {
      const set = new Set(String(roleIn).split(',').map((s) => s.trim()));
      users = users.filter((u) => set.has(u.role));
    }
    const mapped = profileMapper.toListResponse(users);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await usersService.getUser(req.params.id, req.user);
    const mapped = profileMapper.toOneResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** Self read for AuthContext; admin/administratif/chef for others. */
export const getProfileSelfOrAdmin = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.user?.role;
    const allowedOther = ['admin', 'administratif', 'chef_equipe'].includes(role);
    if (id !== req.user?.id && !allowedOther) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
    const user = await usersService.getUser(id, req.user);
    const mapped = profileMapper.toOneResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

function isAvatarSelfPatch(patch) {
  const keys = Object.keys(patch ?? {});
  return keys.length > 0 && keys.every((k) => k === 'avatar_path' || k === 'avatar_updated_at');
}

export const patchProfile = asyncHandler(async (req, res) => {
  try {
    const { id, patch } = profileMapper.fromPatchRequest(req.params, req.body);
    if (!id) {
      throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    }
    const user = isAvatarSelfPatch(patch)
      ? await usersService.updateOwnAvatar(id, patch, req.user)
      : await usersService.updateUser(id, patch, req.user);
    const mapped = profileMapper.toPatchResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = profileMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
