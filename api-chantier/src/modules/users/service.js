/**
 * Users — Imp-03 create/delete/list + Imp-11 Administration PATCH / role lifecycle.
 * Multi-tenant: company-scoped for admin; system_admin creates company admins only via platform API.
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { hashPassword, BUSINESS_ROLES } from '../auth/service.js';
import { logger } from '../../shared/utils/logger.js';
import { query } from '../../shared/db/pool.js';
import {
  assertCanAccessProfile,
  isSystemAdmin,
  assertSameCompany,
} from '../../shared/authz/tenantScope.js';
import { resolveCreateRolePolicy } from '../../shared/authz/roleMatrix.js';
import { normalizeMatricule } from '../../shared/utils/matricule.js';
import * as repo from './repository.js';

const nonEmptyName = z.string().trim().min(1).max(120);

const createSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  role: z.enum(BUSINESS_ROLES),
  nom: nonEmptyName,
  prenom: nonEmptyName,
  matricule: z.string().max(64).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  company_id: z.string().uuid().optional(),
});

const patchSchema = z
  .object({
    email: z.string().email().max(320).optional(),
    nom: nonEmptyName.optional(),
    prenom: nonEmptyName.optional(),
    phone: z.string().max(40).optional(),
    role: z.enum(BUSINESS_ROLES).optional(),
    matricule: z.string().max(64).optional().nullable(),
    actif: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' });

export async function listUsers(actor, queryParams = {}) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const rows = await repo.findAll(actor, {});
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    nom: r.nom,
    prenom: r.prenom,
    matricule: r.matricule,
    phone: r.phone ?? '',
    actif: r.actif,
    company_id: r.company_id,
    company_name: r.company_name ?? null,
    company_slug: r.company_slug ?? null,
    avatar_path: r.avatar_path ?? null,
    avatar_updated_at: r.avatar_updated_at ?? null,
  }));
}

export async function getUser(id, actor) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  if (actor && !isSystemAdmin(actor)) {
    assertCanAccessProfile(actor, row);
  }
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    nom: row.nom,
    prenom: row.prenom,
    matricule: row.matricule,
    phone: row.phone ?? '',
    actif: row.actif,
    company_id: row.company_id,
    company_name: row.company_name ?? null,
    company_slug: row.company_slug ?? null,
    avatar_path: row.avatar_path ?? null,
    avatar_updated_at: row.avatar_updated_at ?? null,
  };
}

/** Self-service avatar update — any authenticated user may update own avatar fields. */
export async function updateOwnAvatar(id, input, actor) {
  if (!actor?.id || actor.id !== id) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const avatarPath = input?.avatar_path;
  if (!avatarPath || typeof avatarPath !== 'string' || !avatarPath.trim()) {
    throw new AppError('avatar_path required', 400, { code: 'VALIDATION_ERROR' });
  }
  const cleanPath = avatarPath.replace(/^\//, '').trim();
  if (!cleanPath.startsWith(`${id}/`) || cleanPath.includes('..')) {
    throw new AppError('Invalid avatar path', 400, { code: 'VALIDATION_ERROR' });
  }
  const avatarUpdatedAt = input?.avatar_updated_at ?? new Date().toISOString();
  const row = await repo.updateAvatar(id, cleanPath, avatarUpdatedAt);
  if (!row) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  return getUser(id, actor);
}

/**
 * Create user — company admin: chef_equipe/ouvrier/administratif within own company.
 * system_admin must use platform-users API (role forced to admin).
 */
export async function createUser(input, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid user payload', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  resolveCreateRolePolicy(actor, data.role);

  let companyId = actor.company_id;

  const passwordHash = await hashPassword(data.password);
  try {
    const row = await repo.insertProfile({
      email: data.email,
      passwordHash,
      role: data.role,
      nom: data.nom,
      prenom: data.prenom,
      matricule: normalizeMatricule(data.matricule),
      phone: data.phone ?? '',
      companyId,
    });
    logger.info('admin.user.created', {
      actorId: actor.id,
      userId: row.id,
      role: row.role,
      companyId,
    });
    return getUser(row.id, actor);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email or matricule conflict', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

export async function updateUser(id, input, actor) {
  if (!actor || (actor.role !== 'admin' && !isSystemAdmin(actor))) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const parsed = patchSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new AppError('Invalid user patch', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const patch = parsed.data;

  const existing = await repo.findById(id);
  if (!existing) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  assertCanAccessProfile(actor, existing);

  if (isSystemAdmin(actor) && existing.role !== 'admin') {
    throw new AppError('System admin can only manage company admin users', 403, {
      code: 'FORBIDDEN',
    });
  }

  if (patch.matricule !== undefined) {
    const next = patch.matricule == null ? '' : String(patch.matricule);
    const cur = existing.matricule == null ? '' : String(existing.matricule);
    if (next !== cur) {
      throw new AppError('Matricule is immutable', 400, { code: 'MATRICULE_IMMUTABLE' });
    }
  }

  if (patch.role !== undefined && patch.role !== existing.role) {
    if (actor.id === id) {
      throw new AppError('Cannot change own role', 400, { code: 'ROLE_LOCK' });
    }
    if (existing.role === 'admin') {
      throw new AppError('Cannot change role of an admin user', 400, { code: 'ROLE_LOCK' });
    }
    if (patch.role === 'admin' || patch.role === 'system_admin') {
      throw new AppError('Cannot promote to admin via this endpoint', 403, { code: 'FORBIDDEN' });
    }
    await assertDemotionAllowed(existing, patch.role);
  }

  try {
    const row = await repo.updateProfile(id, {
      email: patch.email,
      nom: patch.nom,
      prenom: patch.prenom,
      phone: patch.phone,
      role: patch.role,
      actif: patch.actif,
    });
    logger.info('admin.user.updated', {
      actorId: actor.id,
      userId: id,
      fromRole: existing.role,
      toRole: row.role,
      fields: Object.keys(patch),
    });
    return getUser(id, actor);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email or matricule conflict', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

async function assertDemotionAllowed(existing, nextRole) {
  if (existing.role !== 'chef_equipe') return;
  if (nextRole === 'chef_equipe') return;

  if (await repo.hasActiveChefAffectation(existing.id)) {
    throw new AppError(
      'Cannot demote: user is still chef_equipe on an active affectation',
      409,
      { code: 'DEMOTION_AFFECTATION_CHEF' },
    );
  }
  if (await repo.ownsZone(existing.id)) {
    throw new AppError(
      'Cannot demote: user still owns a zone equipe',
      409,
      { code: 'DEMOTION_ZONE_OWNER' },
    );
  }
}

async function cleanupUserDiversBlockers(userId, adminId) {
  const { rows: pending } = await query(
    `SELECT id FROM chantiers
     WHERE created_by = $1 AND source = 'divers' AND divers_statut = 'en_attente'`,
    [userId],
  );

  for (const chantier of pending) {
    const chantierId = chantier.id;
    await query(`DELETE FROM declarations_heures WHERE chantier_id = $1`, [chantierId]);
    await query(`DELETE FROM periodes_travail WHERE chantier_id = $1`, [chantierId]);
    await query(`DELETE FROM affectations_chantiers WHERE chantier_id = $1`, [chantierId]);
    await query(`DELETE FROM zones_chantiers WHERE chantier_id = $1`, [chantierId]);
    await query(`DELETE FROM chantiers WHERE id = $1`, [chantierId]);
  }

  await query(
    `UPDATE chantiers SET created_by = $1
     WHERE created_by = $2 AND source = 'divers' AND divers_statut IN ('approuve', 'rejete')`,
    [adminId, userId],
  );
  await query(
    `UPDATE chantiers SET divers_reviewed_by = $1 WHERE divers_reviewed_by = $2`,
    [adminId, userId],
  );
}

function mapDeleteUserError(err) {
  const raw = err?.message ?? String(err ?? '');
  if (raw.includes('periodes_travail') && raw.includes('does not exist')) {
    return 'Erreur base de données lors de la suppression (trigger periodes_travail). Contactez l\'administrateur pour appliquer la migration fix_auth_delete_user_search_path.';
  }
  if (raw.includes('violates foreign key constraint')) {
    return 'Impossible de supprimer cet utilisateur : des enregistrements liés existent encore dans la base.';
  }
  if (raw.includes('chantiers_divers_fields_consistent')) {
    return 'Impossible de supprimer cet utilisateur : des chantiers divers liés bloquent la suppression. Appliquez la migration fix_delete_user_divers_chantiers.';
  }
  if (raw.includes('zone')) {
    return 'Impossible de supprimer cet utilisateur : il est encore chef d\'au moins une zone d\'équipe. Réassignez la zone ou supprimez-la d\'abord dans la gestion.';
  }
  return raw || 'Impossible de supprimer cet utilisateur.';
}

export async function deleteUser(id, actor) {
  if (!actor || (actor.role !== 'admin' && !isSystemAdmin(actor))) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (actor.id === id) {
    throw new AppError('Impossible de supprimer votre propre compte', 400, { code: 'SELF_DELETE' });
  }

  const existing = await repo.findById(id);
  if (!existing) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  assertCanAccessProfile(actor, existing);

  if (isSystemAdmin(actor) && existing.role !== 'admin') {
    throw new AppError('System admin can only delete company admin users', 403, { code: 'FORBIDDEN' });
  }

  if (await repo.ownsZone(id)) {
    throw new AppError(
      'Impossible de supprimer cet utilisateur : il est encore chef d\'au moins une zone d\'équipe. Réassignez la zone ou supprimez-la d\'abord dans la gestion.',
      409,
      { code: 'ZONE_RESTRICT' },
    );
  }

  try {
    await cleanupUserDiversBlockers(id, actor.id);
    const ok = await repo.deleteById(id);
    if (!ok) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
    logger.info('admin.user.deleted', { actorId: actor.id, userId: id });
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(mapDeleteUserError(err), 500, { code: 'DELETE_FAILED' });
  }
}

/** Reset password for company admin (system_admin or self-service elsewhere). */
export async function resetUserPassword(id, newPassword, actor) {
  if (!actor || (!isSystemAdmin(actor) && actor.role !== 'admin')) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  assertCanAccessProfile(actor, existing);
  if (isSystemAdmin(actor) && existing.role !== 'admin') {
    throw new AppError('System admin can only reset company admin passwords', 403, { code: 'FORBIDDEN' });
  }
  const passwordHash = await hashPassword(newPassword);
  await query(`UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
    passwordHash,
    id,
  ]);
  return { ok: true };
}

export async function lockUser(id, actor, actif = false) {
  if (!actor || !isSystemAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  if (existing.role !== 'admin') {
    throw new AppError('System admin can only lock/unlock company admins', 403, { code: 'FORBIDDEN' });
  }
  await repo.updateProfile(id, { actif });
  return getUser(id, actor);
}
