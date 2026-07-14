export * from './colors';
export * from './spacing';
export * from './layout';

export const APP_CONFIG = {
  name: 'BTP Heures',
  version: '1.0.0',
  description: 'Gestion des heures de chantier',
} as const;

export const ROLES = {
  OUVRIER: 'ouvrier',
  CHEF_EQUIPE: 'chef_equipe',
  ADMINISTRATIF: 'administratif',
  ADMIN: 'admin',
} as const;

/** Roles that can be assigned to a chantier (add/edit user picker) */
export const CHANTIER_ASSIGNABLE_ROLES = [ROLES.CHEF_EQUIPE, ROLES.OUVRIER] as const;

export function isChantierAssignableRole(role: string): boolean {
  return (CHANTIER_ASSIGNABLE_ROLES as readonly string[]).includes(role);
}

export const STATUTS = {
  BROUILLON: 'brouillon',
  SOUMISE: 'soumise',
  VALIDEE: 'validee',
  REJETEE: 'rejetee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
} as const;