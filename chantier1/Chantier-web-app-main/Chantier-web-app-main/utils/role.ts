import { UserRole } from '@/types';

type HomeRoute = '/(tabs)/ouvrier-dashboard' | '/(tabs)/export' | '/(tabs)';

export function getRoleLabel(role: UserRole): string {
  const roles: Record<UserRole, string> = {
    ouvrier: 'Ouvrier',
    chef_equipe: "Chef d'équipe",
    administratif: 'Administratif',
    admin: 'Admin',
  };
  return roles[role] || role;
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    ouvrier: 'Déclaration des heures de travail',
    chef_equipe: 'Validation des heures de votre équipe',
    administratif: 'Export des données pour la paie',
    admin: 'Administration complète du système',
  };
  return descriptions[role] || '';
}

export function canValidate(role: UserRole): boolean {
  return ['chef_equipe', 'admin'].includes(role);
}

export function canExport(role: UserRole): boolean {
  return ['administratif', 'admin', 'chef_equipe'].includes(role);
}

export function canManageTeam(role: UserRole): boolean {
  return role === 'chef_equipe';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/** Admin users cannot have their role changed in the edit user form. */
export function isAdminUserRoleLocked(role: UserRole): boolean {
  return role === 'admin';
}

export function canAccessManagement(role: UserRole): boolean {
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
  return role === 'admin' || role === 'administratif';
}

/** Roles that see the approval notification bell (timesheet and/or worksite requests). */
export function canReceiveApprovalNotifications(role: UserRole | undefined): boolean {
  if (!role) return false;
  return canValidate(role) || canReviewChantierDivers(role);
}

/** Ouvrier sees collaborator notifications (shift status + new worksites). */
export function canReceiveCollaboratorNotifications(role: UserRole | undefined): boolean {
  if (!role) return false;
  return isWorker(role);
}

export function canViewTeamAbsences(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'chef_equipe' || role === 'admin' || role === 'administratif';
}

/** Default tab route after login or when opening the app. */
export function getHomeRouteForRole(role: UserRole | undefined): HomeRoute {
  switch (role) {
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

/** Number of bottom tabs visible for a role (for equal-width tab bar on mobile). */
export function getVisibleTabCount(role: UserRole | undefined): number {
  if (!role) return 1;
  switch (role) {
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
