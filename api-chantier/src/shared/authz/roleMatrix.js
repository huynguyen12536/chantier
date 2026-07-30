import { AppError } from '../errors/AppError.js';
import { isSystemAdmin, assertSameCompany } from './tenantScope.js';

const PLATFORM_PERMISSIONS = new Set([
  'companies.manage',
  'company_admins.manage',
  'platform.dashboard',
  'platform.audit',
  'platform.settings',
]);

const COMPANY_PERMISSIONS = new Set([
  'users.manage',
  'worksites.manage',
  'zones.manage',
  'reports.manage',
  'attendance.manage',
  'company.settings',
]);

const BUSINESS_ROLE_MAP = {
  'attendance.check_in': ['ouvrier', 'chef_equipe'],
  'attendance.check_out': ['ouvrier', 'chef_equipe'],
  'attendance.submit': ['ouvrier', 'chef_equipe'],
  'attendance.update_own': ['ouvrier', 'chef_equipe'],
  'attendance.approve': ['chef_equipe', 'admin'],
  'reports.export': ['administratif', 'admin', 'chef_equipe'],
};

export function assertPlatformPermission(actor, permission) {
  if (!PLATFORM_PERMISSIONS.has(permission)) {
    throw new AppError('Unknown platform permission', 500, { code: 'INTERNAL' });
  }
  if (!isSystemAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

export function assertCompanyPermission(actor, permission, targetCompanyId = null) {
  if (isSystemAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (!COMPANY_PERMISSIONS.has(permission)) {
    throw new AppError('Unknown company permission', 500, { code: 'INTERNAL' });
  }
  if (actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (targetCompanyId) {
    assertSameCompany(actor, targetCompanyId);
  }
}

export function assertBusinessPermission(actor, permission) {
  if (isSystemAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const allowed = BUSINESS_ROLE_MAP[permission];
  if (!allowed) {
    throw new AppError('Unknown business permission', 500, { code: 'INTERNAL' });
  }
  if (!allowed.includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

/** Roles system_admin may create via platform-users module. */
export function assertSystemAdminCanCreateRole(actor, role) {
  assertPlatformPermission(actor, 'company_admins.manage');
  if (role !== 'admin') {
    throw new AppError('System admin can only create company admin users', 403, {
      code: 'FORBIDDEN_ROLE_CREATE',
    });
  }
}

/** Roles company admin may create. */
export function assertCompanyAdminCanCreateRole(actor, role) {
  assertCompanyPermission(actor, 'users.manage');
  const allowed = ['chef_equipe', 'ouvrier', 'administratif'];
  if (!allowed.includes(role)) {
    throw new AppError('Company admin cannot create this role', 403, {
      code: 'FORBIDDEN_ROLE_CREATE',
    });
  }
}

export function resolveCreateRolePolicy(actor, role) {
  if (isSystemAdmin(actor)) {
    assertSystemAdminCanCreateRole(actor, role);
    return 'system_admin';
  }
  if (actor.role === 'admin') {
    assertCompanyAdminCanCreateRole(actor, role);
    return 'company_admin';
  }
  throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
}
