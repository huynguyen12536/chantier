/**
 * Affectations — Imp-05 Parity vs CVL rls-analysis §62–66 + production policies.
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

const assignSchema = z
  .object({
    user_id: z.string().uuid(),
    chantier_id: z.string().uuid(),
    chef_equipe_id: z.string().uuid().optional().nullable(),
    date_debut: z.string().optional(),
    date_fin: z.string().optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.date_fin && d.date_debut && d.date_fin < d.date_debut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'date_fin must be >= date_debut',
        path: ['date_fin'],
      });
    }
  });

/** CVL insert/update: admin | administratif | chef_equipe */
function assertCanWriteAffectation(actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

/**
 * Scoped list — CVL SELECT policies:
 * - admin/administratif: all
 * - chef: chef_equipe_id = actor (team rows)
 * - ouvrier: own user_id
 */
export async function listAffectations(filters, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  const chantierId = filters?.chantier_id ?? null;

  if (['admin', 'administratif'].includes(actor.role)) {
    const { rows } = await query(
      `SELECT * FROM affectations_chantiers
       WHERE ($1::uuid IS NULL OR chantier_id = $1)
       ORDER BY created_at DESC`,
      [chantierId],
    );
    return rows;
  }

  if (actor.role === 'chef_equipe') {
    const { rows } = await query(
      `SELECT * FROM affectations_chantiers
       WHERE chef_equipe_id = $1
         AND ($2::uuid IS NULL OR chantier_id = $2)
       ORDER BY created_at DESC`,
      [actor.id, chantierId],
    );
    return rows;
  }

  // ouvrier — own only
  const { rows } = await query(
    `SELECT * FROM affectations_chantiers
     WHERE user_id = $1
       AND ($2::uuid IS NULL OR chantier_id = $2)
     ORDER BY created_at DESC`,
    [actor.id, chantierId],
  );
  return rows;
}

/** Unique (user, chantier); soft-end via date_fin — SUMMARY §5 #4 */
export async function assignUser(input, actor) {
  assertCanWriteAffectation(actor);
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid affectation', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const d = parsed.data;
  try {
    const { rows } = await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin)
       VALUES ($1,$2,$3, COALESCE($4::date, CURRENT_DATE), $5::date)
       ON CONFLICT (user_id, chantier_id) DO UPDATE SET
         chef_equipe_id = EXCLUDED.chef_equipe_id,
         date_debut = EXCLUDED.date_debut,
         date_fin = EXCLUDED.date_fin
       RETURNING *`,
      [d.user_id, d.chantier_id, d.chef_equipe_id ?? null, d.date_debut ?? null, d.date_fin ?? null],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23503') {
      throw new AppError('Referenced user/chantier missing', 400, { code: 'FK' });
    }
    if (err.code === '23514') {
      throw new AppError('Invalid date range', 400, { code: 'VALIDATION_ERROR' });
    }
    throw err;
  }
}

export async function softRemoveAffectation(id, actor) {
  assertCanWriteAffectation(actor);
  const { rows } = await query(
    `UPDATE affectations_chantiers SET date_fin = CURRENT_DATE WHERE id = $1 RETURNING *`,
    [id],
  );
  if (!rows[0]) throw new AppError('Affectation not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}
