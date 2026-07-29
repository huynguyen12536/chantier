import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { rateLimitMiddleware } from '../../../shared/middleware/rateLimit.js';
import * as controller from './controller.js';

const router = Router();

const otpLimiter = rateLimitMiddleware({
  windowMs: 60 * 1000,
  max: 3,
  keyFn: (req) => `otp:${req.ip ?? 'unknown'}:${String(req.body?.email ?? '').toLowerCase()}`,
});

router.options('/create-user', controller.options);
router.options('/delete-user', controller.options);
router.options('/send-password-reset-otp', controller.options);
router.options('/reset-password-with-otp', controller.options);
router.options('/update-user-password', controller.options);

router.post('/create-user', requireAuth, controller.createUser);
router.post('/delete-user', requireAuth, controller.deleteUser);
router.post('/send-password-reset-otp', otpLimiter, controller.sendPasswordResetOtp);
router.post('/reset-password-with-otp', controller.resetPasswordWithOtp);
router.post('/update-user-password', requireAuth, controller.updateUserPassword);

export default router;
