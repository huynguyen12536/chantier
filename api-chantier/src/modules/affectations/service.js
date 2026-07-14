import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

const assignSchema = z.object({
  user_id: z.string().uuid(),
  chantier_id: z.string().uuid(),
  chef_equipe_id: z.string().uuid().optional().nullable(),
  date_debut: z.string().optional(),
  date_fin: z.string().optional().nullable(),
});

export async function listAffectations(chantierId) {
  const { rows } = await query(
    `SELECT * FROM affectations_chantiers
     WHERE ($1::uuid IS NULL OR chantier_id = $1)
     ORDER BY created_at DESC`,
    [chantierId ?? null],
  );
  return rows;
}

/** Unique (user, chantier); soft-end via date_fin — SUMMARY §5 #4 */
export async function assignUser(input, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
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
    if (err.code === '23503') throw new AppError('Referenced user/chantier missing', 400, { code: 'FK' });
    throw err;
  }
}

export async function softRemoveAffectation(id, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const { rows } = await query(
    `UPDATE affectations_chantiers SET date_fin = CURRENT_DATE WHERE id = $1 RETURNING *`,
    [id],
  );
  if (!rows[0]) throw new AppError('Affectation not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}

const zoneSchema = z.object({
  nom: z.string().min(1).max(200),
  chef_equipe_id: z.string().uuid(),
});

export async function createZone(input, actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid zone', 400, { code: 'VALIDATION_ERROR' });
  }
  if (actor.role === 'chef_equipe' && actor.id !== parsed.data.chef_equipe_id) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const { rows } = await query(
    `INSERT INTO zones_equipe (nom, chef_equipe_id) VALUES ($1,$2) RETURNING *`,
    [parsed.data.nom, parsed.data.chef_equipe_id],
  );
  return rows[0];
}

export async function linkZoneChantier(zoneId, chantierId, actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const { rows } = await query(
    `INSERT INTO zones_chantiers (zone_id, chantier_id) VALUES ($1,$2)
     ON CONFLICT (zone_id, chantier_id) DO NOTHING
     RETURNING *`,
    [zoneId, chantierId],
  );
  return rows[0] ?? { zone_id: zoneId, chantier_id: chantierId, linked: true };
}

export async function addZoneOuvrier(zoneId, userId, actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const { rows } = await query(
    `INSERT INTO zones_ouvriers (zone_id, user_id) VALUES ($1,$2)
     ON CONFLICT (zone_id, user_id) DO UPDATE SET date_fin = NULL
     RETURNING *`,
    [zoneId, userId],
  );
  return rows[0];
}

export async function listZones() {
  const { rows } = await query(`SELECT * FROM zones_equipe ORDER BY created_at DESC`);
  return rows;
}
