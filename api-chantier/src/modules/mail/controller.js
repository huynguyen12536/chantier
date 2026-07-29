import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as mailService from './service.js';

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await mailService.requestPasswordReset(req.body ?? {});
  res.status(202).json(result);
});
