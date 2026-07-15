/**
 * Users — Imp-03 create/delete/list + Imp-11 Administration PATCH / role lifecycle.
 * Demotion guards READ Imp-05 tables only (no Affectations/Zones business rewrite).
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { hashPassword, ROLES, publicProfile } from '../auth/service.js';
import { logger } from '../../shared/utils/logger.js';
import * as repo from './repository.js';

const nonEmptyName = z.string().trim().min(1).max(120);

const createSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  role: z.enum(ROLES),
  nom: nonEmptyName,
  prenom: nonEmptyName,
  matricule: z.string().max(64).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

const patchSchema = z
  .object({
    email: z.string().email().max(320).optional(),
    nom: nonEmptyName.optional(),
    prenom: nonEmptyName.optional(),
    phone: z.string().max(40).optional(),
    role: z.enum(ROLES).optional(),
    matricule: z.string().max(64).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' });

export async function listUsers() {
  const rows = await repo.findAll();
  return rows.map(publicProfile);
}

export async function getUser(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  return publicProfile(row);
}

/**
 * Create user — CVL: admin OR administratif (SUMMARY §5 rule 2 / Edge create-user).
 */
export async function createUser(input, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
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
  const passwordHash = await hashPassword(data.password);
  try {
    const row = await repo.insertProfile({
      email: data.email,
      passwordHash,
      role: data.role,
      nom: data.nom,
      prenom: data.prenom,
      matricule: data.matricule ?? null,
      phone: data.phone ?? '',
    });
    logger.info('admin.user.created', {
      actorId: actor.id,
      userId: row.id,
      role: row.role,
    });
    return publicProfile(row);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email or matricule conflict', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

/**
 * Imp-11 PATCH — profile fields + role lifecycle (admin only for other users).
 */
export async function updateUser(id, input, actor) {
  if (!actor || actor.role !== 'admin') {
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
    await assertDemotionAllowed(existing, patch.role);
  }

  try {
    const row = await repo.updateProfile(id, {
      email: patch.email,
      nom: patch.nom,
      prenom: patch.prenom,
      phone: patch.phone,
      role: patch.role,
    });
    logger.info('admin.user.updated', {
      actorId: actor.id,
      userId: id,
      fromRole: existing.role,
      toRole: row.role,
      fields: Object.keys(patch),
    });
    return publicProfile(row);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email or matricule conflict', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

/**
 * Demotion guards — READ Imp-05 only.
 * Block leaving chef_equipe when still active chef on affectations OR owns a zone.
 */
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

/**
 * Delete user — CVL: admin only; cannot self-delete (SUMMARY §5 rule 2–3).
 */
export async function deleteUser(id, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (actor.id === id) {
    throw new AppError('Cannot delete yourself', 400, { code: 'SELF_DELETE' });
  }

  if (await repo.ownsZone(id)) {
    throw new AppError('Cannot delete chef with owned zone', 409, { code: 'ZONE_RESTRICT' });
  }

  const ok = await repo.deleteById(id);
  if (!ok) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  logger.info('admin.user.deleted', { actorId: actor.id, userId: id });
  return { ok: true };
}
