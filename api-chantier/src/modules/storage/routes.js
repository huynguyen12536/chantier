import { Router } from 'express';
import express from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
const avatarUpload = express.raw({ type: ['image/*', 'application/octet-stream'], limit: '5mb' });

router.get('/worksite-images', controller.listWorksiteImages);
router.get('/worksite-images/:index', controller.getWorksiteImage);

router.get('/avatars/*path', controller.getAvatar);
router.put('/avatars/*path', requireAuth, avatarUpload, controller.putAvatar);
router.delete('/avatars/*path', requireAuth, controller.deleteAvatar);

export default router;
