import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as storageService from './service.js';
import { getMinioClient, objectExists } from './minioClient.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';

const WORKSITE_PREFIX = 'worksite/default-';

export const listWorksiteImages = asyncHandler(async (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = (await storageService.listWorksiteImageUrls()).map((p) => `${base}${p}`);
  res.json({ urls, count: urls.length });
});

export const getWorksiteImage = asyncHandler(async (req, res) => {
  const index = Number.parseInt(String(req.params.index ?? '0'), 10);
  const safe = Number.isFinite(index) ? Math.max(0, index) : 0;
  const key = `${WORKSITE_PREFIX}${safe % 8}.jpg`;
  await storageService.seedWorksiteImagesIfNeeded();

  const mc = getMinioClient();
  if (!mc || !(await objectExists(key))) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const stream = await mc.getObject(env.minioBucket, key);
  stream.pipe(res);
});

function avatarRelativePath(req) {
  const raw = req.params.path ?? req.params[0] ?? '';
  const joined = Array.isArray(raw) ? raw.join('/') : String(raw);
  const clean = joined.replace(/^\/+/, '');
  if (!clean || clean.includes('..')) {
    throw new AppError('Invalid avatar path', 400);
  }
  return clean;
}

function avatarContentType(relativePath) {
  const ext = String(relativePath).split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

export const getAvatar = asyncHandler(async (req, res) => {
  const relativePath = avatarRelativePath(req);
  const stream = await storageService.getAvatarStream(relativePath);
  if (!stream) {
    return res.status(404).json({ error: 'Avatar not found' });
  }
  res.setHeader('Content-Type', avatarContentType(relativePath));
  res.setHeader('Cache-Control', 'public, max-age=3600');
  stream.pipe(res);
});

export const putAvatar = asyncHandler(async (req, res) => {
  const relativePath = avatarRelativePath(req);
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401);
  if (!relativePath.startsWith(`${userId}/`)) {
    throw new AppError('Forbidden', 403);
  }

  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? []);
  if (!body.length) throw new AppError('Empty body', 400);

  const contentType = req.headers['content-type'] ?? 'image/jpeg';
  const url = await storageService.putAvatar(relativePath, body, contentType);
  res.status(200).json({ Key: relativePath, path: relativePath, url });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const relativePath = avatarRelativePath(req);
  const userId = req.user?.id;
  if (!userId || !relativePath.startsWith(`${userId}/`)) {
    throw new AppError('Forbidden', 403);
  }
  await storageService.removeAvatar(relativePath);
  res.status(204).end();
});
