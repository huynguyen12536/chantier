import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as usersService from '../../users/service.js';
import * as diversService from '../../chantiers/diversService.js';
import * as mailOtp from '../../mail/otp.js';
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

function otpErrorCode(err) {
  // Edge functions return machine codes in `error` (e.g. invalid_or_expired_otp).
  // AppError puts that string in `message`, while `code` is VALIDATION_ERROR / etc.
  if (typeof err?.message === 'string' && err.message && !/\s/.test(err.message)) {
    return err.message;
  }
  return err?.code ?? 'server_error';
}

export const sendPasswordResetOtp = asyncHandler(async (req, res) => {
  try {
    const result = await mailOtp.sendPasswordResetOtp(req.body?.email, req.body?.lang);
    res.status(200).json(result);
  } catch (err) {
    const code = otpErrorCode(err);
    const status = err.statusCode ?? (code === 'rate_limited' ? 429 : 500);
    res.status(status).json({ error: code });
  }
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  try {
    const result = await mailOtp.verifyPasswordResetOtp(req.body?.email, req.body?.otp);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode ?? 400).json({ error: otpErrorCode(err) });
  }
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  try {
    const result = await mailOtp.resetPasswordWithOtp(
      req.body?.email,
      req.body?.otp,
      req.body?.password,
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode ?? 400).json({ error: otpErrorCode(err) });
  }
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  try {
    const result = await diversService.adminUpdateUserAuth(req.user, req.body ?? {});
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode ?? 400).json({ error: err.message });
  }
});
