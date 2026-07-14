import { AppError } from '../errors/AppError.js';

/**
 * Auth middleware stub — Phase 5 sẽ verify JWT và gắn req.user.
 * Hiện tại chỉ fail nếu gọi route protected mà chưa có Authorization.
 */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' }));
  }
  // Placeholder until Phase 5 JWT verification
  req.user = { id: null, tokenPresent: true };
  return next();
}
