import { AppError } from '../errors/AppError.js';
import { isSystemAdmin } from '../authz/tenantScope.js';

export function requireSystemAdmin(req, _res, next) {
  if (!isSystemAdmin(req.user)) {
    return next(new AppError('Forbidden', 403, { code: 'FORBIDDEN' }));
  }
  return next();
}

export function blockDisabledCompany(req, _res, next) {
  if (isSystemAdmin(req.user)) return next();
  if (req.user?.company_status === 'disabled') {
    return next(new AppError('Company is disabled', 403, { code: 'COMPANY_DISABLED' }));
  }
  return next();
}

/** Hard deny system_admin from operational business routes. */
export function forbidSystemAdminOperational(req, _res, next) {
  if (isSystemAdmin(req.user)) {
    return next(new AppError('System admin cannot access operational modules', 403, {
      code: 'FORBIDDEN_OPERATIONAL',
    }));
  }
  return next();
}
