/**
 * Imp-12 Wave B auth adapter — transport only (DR-B-004=A).
 */
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as authService from '../../auth/service.js';
import * as authMapper from '../mappers/authMapper.js';

/**
 * POST /token
 * grant_type=password | refresh_token (query or body)
 */
export const token = asyncHandler(async (req, res) => {
  try {
    const grant =
      req.query?.grant_type ||
      req.body?.grant_type ||
      (req.body?.refresh_token || req.body?.refreshToken ? 'refresh_token' : 'password');

    if (grant === 'refresh_token') {
      const refreshToken = authMapper.fromRefreshGrant(req.body, req.query);
      const session = await authService.refresh(refreshToken);
      const mapped = authMapper.toSessionResponse(session);
      res.status(mapped.status).json(mapped.body);
      return;
    }

    if (grant === 'password') {
      const input = authMapper.fromPasswordGrant(req.body);
      const session = await authService.login(input);
      const mapped = authMapper.toSessionResponse(session);
      res.status(mapped.status).json(mapped.body);
      return;
    }

    throw new AppError('Unsupported grant_type', 400, { code: 'VALIDATION_ERROR' });
  } catch (err) {
    const mapped = authMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const logout = asyncHandler(async (req, res) => {
  try {
    const refreshToken = authMapper.fromRefreshGrant(req.body, req.query);
    await authService.logout(refreshToken);
    const mapped = authMapper.toLogoutResponse();
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = authMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** GET /user — Bearer already validated by requireAuth; reuse Imp-02 profile load. */
export const user = asyncHandler(async (req, res) => {
  try {
    const profile = await authService.getProfileById(req.user.id);
    const mapped = authMapper.toUserResponse(profile);
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = authMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
