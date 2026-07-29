import * as Minio from 'minio';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';

let client = null;

export function getMinioClient() {
  if (!env.minioEnabled) return null;
  if (!client) {
    client = new Minio.Client({
      endPoint: env.minioEndpoint,
      port: env.minioPort,
      useSSL: env.minioUseSsl,
      accessKey: env.minioAccessKey,
      secretKey: env.minioSecretKey,
    });
  }
  return client;
}

export async function ensureBucket() {
  const mc = getMinioClient();
  if (!mc) return false;
  const exists = await mc.bucketExists(env.minioBucket);
  if (!exists) {
    await mc.makeBucket(env.minioBucket, env.minioRegion);
    logger.info('minio.bucket.created', { bucket: env.minioBucket });
  }
  return true;
}

/**
 * @param {string} objectKey
 * @returns {string}
 */
export function publicObjectUrl(objectKey) {
  const proto = env.minioUseSsl ? 'https' : 'http';
  const host = env.minioPublicHost || `${env.minioEndpoint}:${env.minioPort}`;
  return `${proto}://${host}/${env.minioBucket}/${objectKey}`;
}

/**
 * @param {string} objectKey
 * @param {Buffer|import('stream').Readable} body
 * @param {string} contentType
 */
export async function putObject(objectKey, body, contentType = 'application/octet-stream') {
  const mc = getMinioClient();
  if (!mc) throw new Error('MinIO disabled');
  await ensureBucket();
  await mc.putObject(env.minioBucket, objectKey, body, undefined, {
    'Content-Type': contentType,
  });
  return publicObjectUrl(objectKey);
}

/**
 * @param {string} objectKey
 */
export async function objectExists(objectKey) {
  const mc = getMinioClient();
  if (!mc) return false;
  try {
    await mc.statObject(env.minioBucket, objectKey);
    return true;
  } catch {
    return false;
  }
}

export async function listObjects(prefix = '') {
  const mc = getMinioClient();
  if (!mc) return [];
  await ensureBucket();
  return new Promise((resolve, reject) => {
    const keys = [];
    const stream = mc.listObjectsV2(env.minioBucket, prefix, true);
    stream.on('data', (obj) => keys.push(obj.name));
    stream.on('error', reject);
    stream.on('end', () => resolve(keys));
  });
}

/**
 * @param {string} objectKey
 */
export async function removeObject(objectKey) {
  const mc = getMinioClient();
  if (!mc) throw new Error('MinIO disabled');
  try {
    await mc.removeObject(env.minioBucket, objectKey);
  } catch (err) {
    if (!/not found|NoSuchKey/i.test(String(err.message ?? err))) {
      throw err;
    }
  }
}

/**
 * @param {string} objectKey
 */
export async function getObjectStream(objectKey) {
  const mc = getMinioClient();
  if (!mc) throw new Error('MinIO disabled');
  return mc.getObject(env.minioBucket, objectKey);
}
