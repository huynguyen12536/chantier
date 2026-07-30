import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { hashPassword } from '../auth/service.js';
import { logPlatformAudit } from '../platform-audit/service.js';
import * as usersRepo from '../users/repository.js';
import * as usersService from '../users/service.js';
import { query } from '../../shared/db/pool.js';

const createAdminSchema = z.object({
  company_id: z.string().uuid(),
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  nom: z.string().min(1).max(120),
  prenom: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
});

const resetSchema = z.object({
  password: z.string().min(6).max(128),
});

const updateAdminSchema = z
  .object({
    email: z.string().email().max(320).optional(),
    nom: z.string().min(1).max(120).optional(),
    prenom: z.string().min(1).max(120).optional(),
    phone: z.string().max(40).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' });

const MONITORING_ROLES = new Set(['admin', 'chef_equipe', 'ouvrier']);

/** Read-only user listing for monitoring (optional company_id / role filters). */
export async function listUsersForMonitoring(actor, queryParams = {}) {
  const role = typeof queryParams.role === 'string' ? queryParams.role.trim() : '';
  if (role && !MONITORING_ROLES.has(role)) {
    throw new AppError('Invalid role filter', 400, { code: 'VALIDATION_ERROR' });
  }
  const rows = await usersRepo.findAll(actor, {
    companyId: queryParams.company_id,
    role: role || undefined,
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    nom: r.nom,
    prenom: r.prenom,
    actif: r.actif,
    company_id: r.company_id,
    avatar_path: r.avatar_path ?? null,
    avatar_updated_at: r.avatar_updated_at ?? null,
  }));
}

export async function createCompanyAdmin(input, actor) {
  const parsed = createAdminSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, { code: 'VALIDATION_ERROR' });
  }
  const data = parsed.data;
  const co = await query(`SELECT id FROM companies WHERE id = $1`, [data.company_id]);
  if (!co.rows[0]) throw new AppError('Company not found', 404, { code: 'NOT_FOUND' });

  const passwordHash = await hashPassword(data.password);
  try {
    const row = await usersRepo.insertProfile({
      email: data.email,
      passwordHash,
      role: 'admin',
      nom: data.nom,
      prenom: data.prenom,
      phone: data.phone ?? '',
      companyId: data.company_id,
    });
    await logPlatformAudit(actor, 'company_admin.create', {
      type: 'profile',
      id: row.id,
      company_id: data.company_id,
    });
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      nom: row.nom,
      prenom: row.prenom,
      matricule: row.matricule,
      actif: row.actif,
      company_id: row.company_id,
    };
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email conflict', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

export async function resetCompanyAdminPassword(id, input, actor) {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, { code: 'VALIDATION_ERROR' });
  }
  await usersService.resetUserPassword(id, parsed.data.password, actor);
  await logPlatformAudit(actor, 'company_admin.reset_password', { type: 'profile', id });
  return { ok: true };
}

export async function lockCompanyAdmin(id, actor, actif = false) {
  const user = await usersService.lockUser(id, actor, actif);
  await logPlatformAudit(actor, actif ? 'company_admin.unlock' : 'company_admin.lock', {
    type: 'profile',
    id,
    company_id: user.company_id,
  });
  return user;
}

export async function updateCompanyAdmin(id, input, actor) {
  const parsed = updateAdminSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, { code: 'VALIDATION_ERROR' });
  }
  const user = await usersService.updateUser(id, parsed.data, actor);
  await logPlatformAudit(actor, 'company_admin.update', {
    type: 'profile',
    id,
    company_id: user.company_id,
  });
  return user;
}

export async function deleteCompanyAdmin(id, actor) {
  const existing = await usersRepo.findById(id);
  if (!existing) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  await usersService.deleteUser(id, actor);
  await logPlatformAudit(actor, 'company_admin.delete', {
    type: 'profile',
    id,
    company_id: existing.company_id,
  });
  return { ok: true };
}
