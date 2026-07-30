import { UserRole } from '@/types';

type HomeRoute =
  | '/(tabs)/ouvrier-dashboard'
  | '/(tabs)/export'
  | '/(tabs)/platform-dashboard'
  | '/(tabs)';

export function isSystemAdmin(role: UserRole | undefined): boolean {
  return role === 'system_admin';
}

export function isCompanyAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canManageCompanies(role: UserRole | undefined): boolean {
  return isSystemAdmin(role);
}

export function canManageCompanyAdmins(role: UserRole | undefined): boolean {
  return isSystemAdmin(role);
}

export function canAccessOperationalTabs(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role !== 'system_admin';
}

export function getRoleLabel(role: UserRole): string {
  const roles: Record<UserRole, string> = {
    ouvrier: 'Ouvrier',
    chef_equipe: "Chef d'équipe",
    administratif: 'Administratif',
    admin: 'Admin',
    system_admin: 'System Admin',
  };
  return roles[role] || role;
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    ouvrier: 'Déclaration des heures de travail',
    chef_equipe: 'Validation des heures de votre équipe',
    administratif: 'Export des données pour la paie',
    admin: 'Administration de votre entreprise',
    system_admin: 'Administration de la plateforme',
  };
  return descriptions[role] || '';
}

export function canValidate(role: UserRole): boolean {
  if (isSystemAdmin(role)) return false;
  return ['chef_equipe', 'admin'].includes(role);
}

export function canExport(role: UserRole): boolean {
  if (isSystemAdmin(role)) return false;
  return ['administratif', 'admin', 'chef_equipe'].includes(role);
}

export function canManageTeam(role: UserRole): boolean {
  return role === 'chef_equipe';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isAdminUserRoleLocked(role: UserRole): boolean {
  return role === 'admin';
}

export function canAccessManagement(role: UserRole): boolean {
  if (isSystemAdmin(role)) return false;
  return role === 'admin' || role === 'chef_equipe';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}

export function canDeleteInManagement(role: UserRole): boolean {
  return role === 'admin';
}

export function isWorker(role: UserRole): boolean {
  return role === 'ouvrier';
}

export function canReviewChantierDivers(role: UserRole): boolean {
  if (isSystemAdmin(role)) return false;
  return role === 'admin' || role === 'administratif';
}

export function canReceiveApprovalNotifications(role: UserRole | undefined): boolean {
  if (!role || isSystemAdmin(role)) return false;
  return canValidate(role) || canReviewChantierDivers(role);
}

export function canReceiveCollaboratorNotifications(role: UserRole | undefined): boolean {
  if (!role) return false;
  return isWorker(role);
}

export function canViewTeamAbsences(role: UserRole | undefined): boolean {
  if (!role || isSystemAdmin(role)) return false;
  return role === 'chef_equipe' || role === 'admin' || role === 'administratif';
}

const PLATFORM_TAB_ROUTES = new Set([
  'platform-dashboard',
  'platform-companies',
  'platform-company-admins',
  'platform-audit',
]);

const SYSTEM_ADMIN_ALLOWED_TABS = new Set([...PLATFORM_TAB_ROUTES, 'profile']);

export function isPlatformTabRoute(tabRoute: string | undefined): boolean {
  return tabRoute != null && PLATFORM_TAB_ROUTES.has(tabRoute);
}

export function canAccessPlatformTabs(role: UserRole | undefined): boolean {
  return isSystemAdmin(role);
}

export function isSystemAdminAllowedTab(tabRoute: string | undefined): boolean {
  return tabRoute != null && SYSTEM_ADMIN_ALLOWED_TABS.has(tabRoute);
}

const OPERATIONAL_STACK_ROUTES = new Set([
  'declare-day',
  'declare-day-suggestion',
  'declare-day-empty',
  'choose-day',
  'declare-absence',
  'absence-detail',
]);

export function isOperationalStackRoute(route: string | undefined): boolean {
  return route != null && OPERATIONAL_STACK_ROUTES.has(route);
}

export function canAccessTabRoute(role: UserRole | undefined, tabRoute: string): boolean {
  if (!role) return false;

  switch (tabRoute) {
    case 'profile':
    case 'index':
      return true;
    case 'platform-dashboard':
    case 'platform-companies':
    case 'platform-company-admins':
    case 'platform-audit':
      return isSystemAdmin(role);
    case 'validation':
      return canValidate(role);
    case 'export':
      return canExport(role);
    case 'management':
    case 'team-management':
    case 'user-payroll':
      return canAccessManagement(role);
    case 'team-absences':
      return canViewTeamAbsences(role);
    case 'admin-users':
    case 'worksite-detail':
      return canManageUsers(role);
    case 'admin-worksites':
      return canReviewChantierDivers(role);
    case 'select-worksite':
    case 'ouvrier-dashboard':
    case 'calendar':
      return isWorker(role);
    case 'timesheet':
      return false;
    case 'chef-dashboard':
      return role === 'chef_equipe' || role === 'admin';
    case 'company-settings':
      return false;
    default:
      return false;
  }
}

export function canAccessAppRoute(role: UserRole | undefined, segments: readonly string[]): boolean {
  if (!role) return false;

  const root = segments[0];
  if (!root) return true;

  if (root === '(auth)') return true;

  if (isSystemAdmin(role)) {
    if (root === '(tabs)') {
      const tabRoute = segments[1];
      if (!tabRoute || tabRoute === 'index') return true;
      return isSystemAdminAllowedTab(tabRoute);
    }
    return false;
  }

  if (root === '(tabs)') {
    const tabRoute = segments[1];
    if (!tabRoute || tabRoute === 'index') return true;
    return canAccessTabRoute(role, tabRoute);
  }

  switch (root) {
    case 'choose-day':
    case 'declare-day':
    case 'declare-day-suggestion':
    case 'declare-day-empty':
    case 'declare-absence':
    case 'absence-detail':
      return role === 'ouvrier';
    case '+not-found':
      return true;
    default:
      return false;
  }
}

export function getHomeRouteForRole(role: UserRole | undefined): HomeRoute {
  switch (role) {
    case 'system_admin':
      return '/(tabs)/platform-dashboard';
    case 'ouvrier':
      return '/(tabs)/ouvrier-dashboard';
    case 'chef_equipe':
      return '/(tabs)/export';
    case 'admin':
    case 'administratif':
      return '/(tabs)/export';
    default:
      return '/(tabs)';
  }
}

export function getVisibleTabCount(role: UserRole | undefined): number {
  if (!role) return 1;
  switch (role) {
    case 'system_admin':
      return 3;
    case 'ouvrier':
      return 3;
    case 'chef_equipe':
      return 5;
    case 'admin':
      return 5;
    case 'administratif':
      return 3;
    default:
      return 1;
  }
}
