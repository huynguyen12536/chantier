import { logger } from '../../shared/utils/logger.js';
import { getMinioClient, objectExists, publicObjectUrl, putObject } from './minioClient.js';

const WORKSITE_PREFIX = 'worksite/default-';
const WORKSITE_COUNT = 8;

const DEFAULT_IMAGE_URLS = [
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2157401/pexels-photo-2157401.jpeg?auto=compress&cs=tinysrgb&w=800',
];

let seedPromise = null;

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function seedWorksiteImagesIfNeeded() {
  if (!getMinioClient()) return [];
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const urls = [];
    for (let i = 0; i < WORKSITE_COUNT; i++) {
      const key = `${WORKSITE_PREFIX}${i}.jpg`;
      if (!(await objectExists(key))) {
        try {
          const buf = await downloadToBuffer(DEFAULT_IMAGE_URLS[i]);
          const url = await putObject(key, buf, 'image/jpeg');
          logger.info('storage.worksite.seeded', { key, url });
        } catch (err) {
          logger.warn('storage.worksite.seed_failed', { index: i, message: err.message });
        }
      }
      urls.push(publicObjectUrl(key));
    }
    return urls;
  })();
  return seedPromise;
}

/**
 * @param {number} index
 */
export async function getWorksiteImageUrl(index = 0) {
  await seedWorksiteImagesIfNeeded();
  const safe = Number.isFinite(index) ? Math.max(0, index) : 0;
  return `/api/storage/worksite-images/${safe % WORKSITE_COUNT}`;
}

export async function listWorksiteImageUrls() {
  await seedWorksiteImagesIfNeeded();
  return Array.from({ length: WORKSITE_COUNT }, (_, i) => `/api/storage/worksite-images/${i}`);
}

export { WORKSITE_COUNT };

const AVATAR_PREFIX = 'avatars/';

function avatarObjectKey(relativePath) {
  const clean = String(relativePath ?? '').replace(/^\/+/, '').replace(/^avatars\//, '');
  if (!clean || clean.includes('..')) {
    throw new Error('Invalid avatar path');
  }
  return `${AVATAR_PREFIX}${clean}`;
}

/**
 * @param {string} relativePath e.g. userId/avatar.jpg
 */
export function avatarApiPath(relativePath) {
  const clean = String(relativePath ?? '').replace(/^\/+/, '');
  return `/api/storage/avatars/${clean}`;
}

export async function putAvatar(relativePath, body, contentType = 'image/jpeg') {
  const key = avatarObjectKey(relativePath);
  await putObject(key, body, contentType);
  return avatarApiPath(relativePath);
}

export async function removeAvatar(relativePath) {
  const key = avatarObjectKey(relativePath);
  const { removeObject } = await import('./minioClient.js');
  await removeObject(key);
}

export async function getAvatarStream(relativePath) {
  const key = avatarObjectKey(relativePath);
  const { getObjectStream, objectExists } = await import('./minioClient.js');
  if (!(await objectExists(key))) return null;
  return getObjectStream(key);
}
