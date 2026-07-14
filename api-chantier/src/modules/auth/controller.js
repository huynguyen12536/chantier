import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as authService from './service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body ?? {});
  res.status(200).json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken ?? req.body?.refresh_token;
  const result = await authService.refresh(token);
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken ?? req.body?.refresh_token;
  const result = await authService.logout(token);
  res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfileById(req.user.id);
  res.status(200).json({ user });
});
