import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import { rateLimitMiddleware } from '../../shared/middleware/rateLimit.js';
import * as controller from './controller.js';
import * as mailController from '../mail/controller.js';

const router = Router();

const forgotPasswordLimiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => `forgot:ip:${req.ip ?? 'unknown'}`,
});

router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', forgotPasswordLimiter, mailController.forgotPassword);
router.get('/me', requireAuth, controller.me);

export default router;
