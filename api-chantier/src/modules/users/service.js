import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';
import { hashPassword, ROLES, publicProfile } from '../auth/service.js';

const createSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  role: z.enum(ROLES),
  nom: z.string().max(120).optional().nullable(),
  prenom: z.string().max(120).optional().nullable(),
  matricule: z.string().max(64).optional().nullable(),
});

export async function listUsers() {
  const { rows } = await query(
    `SELECT id, email, role, nom, prenom, matricule, actif
     FROM profiles
     ORDER BY created_at DESC`,
  );
  return rows.map(publicProfile);
}

export async function getUser(id) {
  const { rows } = await query(
    `SELECT id, email, role, nom, prenom, matricule, actif
     FROM profiles WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!rows[0]) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  return publicProfile(rows[0]);
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
    const { rows } = await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, matricule)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'M' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
       RETURNING id, email, role, nom, prenom, matricule, actif`,
      [data.email, passwordHash, data.role, data.nom ?? null, data.prenom ?? null, data.matricule ?? null],
    );
    return publicProfile(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Email already exists', 409, { code: 'CONFLICT' });
    }
    throw err;
  }
}

/**
 * Delete user — CVL: admin only; cannot self-delete (SUMMARY §5 rule 2–3).
 * Zone RESTRICT (rule 3) enforced when zones table exists (Imp-05); for now soft-check no-op.
 */
export async function deleteUser(id, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (actor.id === id) {
    throw new AppError('Cannot delete yourself', 400, { code: 'SELF_DELETE' });
  }

  // Future Imp-05: block if zones_equipe.chef_equipe_id = id (RESTRICT)
  const zoneCheck = await query(
    `SELECT to_regclass('public.zones_equipe') AS exists`,
  );
  if (zoneCheck.rows[0]?.exists) {
    const owned = await query(
      `SELECT 1 FROM zones_equipe WHERE chef_equipe_id = $1 LIMIT 1`,
      [id],
    );
    if (owned.rows[0]) {
      throw new AppError('Cannot delete chef with owned zone', 409, { code: 'ZONE_RESTRICT' });
    }
  }

  const { rowCount } = await query(`DELETE FROM profiles WHERE id = $1`, [id]);
  if (!rowCount) throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  return { ok: true };
}
