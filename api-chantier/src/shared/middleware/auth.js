import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';
import { env } from '../../config/env.js';

/**
 * Verify JWT access token and attach req.user (Imp-02).
 * Fail-closed: missing/invalid token → 401.
 */
function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  // EventSource cannot set Authorization; allow query token for SSE clients.
  const q = req.query?.access_token ?? req.query?.token;
  if (typeof q === 'string' && q.trim()) return q.trim();
  return '';
}

export function requireAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' }));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch {
    return next(new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' }));
  }
}

/** Alias — same as requireAuth (Bearer or ?access_token=). */
export const requireAuthAllowQueryToken = requireAuth;

/** Require one of the listed roles (RBAC foundation). */
export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user?.id) {
      return next(new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' }));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, { code: 'FORBIDDEN' }));
    }
    return next();
  };
}
