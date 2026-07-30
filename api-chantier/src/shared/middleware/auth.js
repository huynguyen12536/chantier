import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';
import { env } from '../../config/env.js';
import { query } from '../db/pool.js';
import { isSystemAdmin } from '../authz/tenantScope.js';

/**
 * Verify JWT access token and attach req.user (Imp-02).
 * Fail-closed: missing/invalid token → 401.
 */
/**
 * Prefer Authorization: Bearer (fetch / Imp-12 adapters).
 * Fallback ?access_token= / ?token= for browser EventSource (cannot set headers).
 * Security note: query tokens may leak via Referer/logs — prefer header when possible.
 */
function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  const q = req.query?.access_token ?? req.query?.token;
  if (typeof q === 'string' && q.trim()) return q.trim();
  return '';
}

async function enrichTenantContext(user) {
  if (!user?.id || isSystemAdmin(user)) {
    return user;
  }
  const { rows } = await query(
    `SELECT p.company_id, c.status AS company_status
     FROM profiles p
     LEFT JOIN companies c ON c.id = p.company_id
     WHERE p.id = $1 LIMIT 1`,
    [user.id],
  );
  const row = rows[0];
  if (!row) return user;
  return {
    ...user,
    company_id: row.company_id ?? user.company_id ?? null,
    company_status: row.company_status ?? user.company_status ?? null,
  };
}

function assertCompanyActive(user) {
  if (isSystemAdmin(user)) return;
  if (user?.company_status === 'disabled') {
    throw new AppError('Company is disabled', 403, { code: 'COMPANY_DISABLED' });
  }
}

export async function requireAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' }));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await enrichTenantContext({
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      company_id: payload.company_id ?? null,
      company_status: payload.company_status ?? null,
    });
    assertCompanyActive(req.user);
    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
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
