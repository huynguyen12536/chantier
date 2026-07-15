import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as usersService from '../../users/service.js';
import * as edgeUserMapper from '../mappers/edgeUserMapper.js';

export const createUser = asyncHandler(async (req, res) => {
  try {
    const input = edgeUserMapper.fromCreateRequest(req.body);
    const user = await usersService.createUser(input, req.user);
    const mapped = edgeUserMapper.toCreateResponse(user);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = edgeUserMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = edgeUserMapper.fromDeleteRequest(req.body);
    if (!userId) {
      throw new AppError('user_id requis', 400, { code: 'VALIDATION_ERROR' });
    }
    await usersService.deleteUser(userId, req.user);
    const mapped = edgeUserMapper.toDeleteResponse();
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = edgeUserMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** CVL Edge preflight. */
export const options = (_req, res) => {
  res.status(200).end();
};
