/**
 * Zones — Imp-05 Parity vs CVL rls-analysis §99–117 + Flow C.
 * Administratif: no zone admin policies (is_admin only).
 * Chef: CRUD only when zone.chef_equipe_id == actor.id (is_zone_owner).
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

const zoneCreateSchema = z.object({
  nom: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  chef_equipe_id: z.string().uuid(),
});

const zoneUpdateSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
});

async function getZone(zoneId) {
  const { rows } = await query(`SELECT * FROM zones_equipe WHERE id = $1`, [zoneId]);
  return rows[0] ?? null;
}

/** Admin bypass; chef must own zone. Administratif forbidden on writes. */
async function assertCanManageZone(actor, zoneId) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  const zone = await getZone(zoneId);
  if (!zone) throw new AppError('Zone not found', 404, { code: 'NOT_FOUND' });
  if (actor.role === 'admin') return zone;
  if (actor.role !== 'chef_equipe') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  if (zone.chef_equipe_id !== actor.id) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN_OWNERSHIP' });
  }
  return zone;
}

function assertCanWriteZonesRole(actor) {
  if (!actor || !['admin', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

/**
 * Scoped list — CVL:
 * - admin: all
 * - chef: own (chef_equipe_id)
 * - ouvrier: assigned active zones_ouvriers
 * - administratif: no SELECT policy → empty
 */
export async function listZones(actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  if (actor.role === 'admin') {
    const { rows } = await query(`SELECT * FROM zones_equipe ORDER BY created_at DESC`);
    return rows;
  }

  if (actor.role === 'chef_equipe') {
    const { rows } = await query(
      `SELECT * FROM zones_equipe WHERE chef_equipe_id = $1 ORDER BY created_at DESC`,
      [actor.id],
    );
    return rows;
  }

  if (actor.role === 'ouvrier') {
    const { rows } = await query(
      `SELECT z.* FROM zones_equipe z
       JOIN zones_ouvriers zo ON zo.zone_id = z.id
       WHERE zo.user_id = $1 AND zo.date_fin IS NULL
       ORDER BY z.created_at DESC`,
      [actor.id],
    );
    return rows;
  }

  // administratif — CVL: blocked from zone admin policies
  return [];
}

export async function createZone(input, actor) {
  assertCanWriteZonesRole(actor);
  const parsed = zoneCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid zone', 400, { code: 'VALIDATION_ERROR' });
  }
  if (actor.role === 'chef_equipe' && actor.id !== parsed.data.chef_equipe_id) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN_OWNERSHIP' });
  }
  const { rows } = await query(
    `INSERT INTO zones_equipe (nom, description, chef_equipe_id)
     VALUES ($1,$2,$3) RETURNING *`,
    [parsed.data.nom, parsed.data.description ?? null, parsed.data.chef_equipe_id],
  );
  return rows[0];
}

export async function updateZone(zoneId, input, actor) {
  await assertCanManageZone(actor, zoneId);
  const parsed = zoneUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid zone', 400, { code: 'VALIDATION_ERROR' });
  }
  const { rows } = await query(
    `UPDATE zones_equipe SET
       nom = COALESCE($2, nom),
       description = CASE WHEN $3::boolean THEN $4 ELSE description END
     WHERE id = $1
     RETURNING *`,
    [
      zoneId,
      parsed.data.nom ?? null,
      parsed.data.description !== undefined,
      parsed.data.description ?? null,
    ],
  );
  return rows[0];
}

export async function deleteZone(zoneId, actor) {
  await assertCanManageZone(actor, zoneId);
  const { rows } = await query(`DELETE FROM zones_equipe WHERE id = $1 RETURNING *`, [zoneId]);
  if (!rows[0]) throw new AppError('Zone not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}

export async function linkZoneChantier(zoneId, chantierId, actor) {
  await assertCanManageZone(actor, zoneId);
  if (!chantierId) {
    throw new AppError('chantier_id required', 400, { code: 'VALIDATION_ERROR' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO zones_chantiers (zone_id, chantier_id) VALUES ($1,$2)
       ON CONFLICT (zone_id, chantier_id) DO NOTHING
       RETURNING *`,
      [zoneId, chantierId],
    );
    return rows[0] ?? { zone_id: zoneId, chantier_id: chantierId, linked: true };
  } catch (err) {
    if (err.code === '23503') throw new AppError('Referenced chantier missing', 400, { code: 'FK' });
    throw err;
  }
}

/** Unlink = DELETE (CVL: no UPDATE on zones_chantiers) */
export async function unlinkZoneChantier(zoneId, chantierId, actor) {
  await assertCanManageZone(actor, zoneId);
  const { rows } = await query(
    `DELETE FROM zones_chantiers WHERE zone_id = $1 AND chantier_id = $2 RETURNING *`,
    [zoneId, chantierId],
  );
  if (!rows[0]) throw new AppError('Link not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}

export async function addZoneOuvrier(zoneId, userId, actor) {
  await assertCanManageZone(actor, zoneId);
  if (!userId) throw new AppError('user_id required', 400, { code: 'VALIDATION_ERROR' });

  const active = await query(
    `SELECT * FROM zones_ouvriers
     WHERE zone_id = $1 AND user_id = $2 AND date_fin IS NULL
     LIMIT 1`,
    [zoneId, userId],
  );
  if (active.rows[0]) {
    throw new AppError('Ouvrier already active in zone', 409, { code: 'CONFLICT' });
  }

  // Restore soft-ended membership if any (CVL UPDATE policy)
  const ended = await query(
    `SELECT * FROM zones_ouvriers
     WHERE zone_id = $1 AND user_id = $2 AND date_fin IS NOT NULL
     ORDER BY date_fin DESC NULLS LAST
     LIMIT 1`,
    [zoneId, userId],
  );
  if (ended.rows[0]) {
    const { rows } = await query(
      `UPDATE zones_ouvriers SET date_fin = NULL, date_debut = CURRENT_DATE
       WHERE id = $1 RETURNING *`,
      [ended.rows[0].id],
    );
    return rows[0];
  }

  try {
    const { rows } = await query(
      `INSERT INTO zones_ouvriers (zone_id, user_id) VALUES ($1,$2) RETURNING *`,
      [zoneId, userId],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23503') throw new AppError('Referenced user missing', 400, { code: 'FK' });
    throw err;
  }
}

/** Soft end zone assignment (CVL UPDATE date_fin) */
export async function softRemoveZoneOuvrier(zoneId, userId, actor) {
  await assertCanManageZone(actor, zoneId);
  const { rows } = await query(
    `UPDATE zones_ouvriers SET date_fin = CURRENT_DATE
     WHERE zone_id = $1 AND user_id = $2 AND date_fin IS NULL
     RETURNING *`,
    [zoneId, userId],
  );
  if (!rows[0]) throw new AppError('Active membership not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}

/** Hard unlink ouvrier (CVL DELETE policy) */
export async function unlinkZoneOuvrier(zoneId, userId, actor) {
  await assertCanManageZone(actor, zoneId);
  const { rows } = await query(
    `DELETE FROM zones_ouvriers WHERE zone_id = $1 AND user_id = $2 RETURNING *`,
    [zoneId, userId],
  );
  if (!rows[0]) throw new AppError('Membership not found', 404, { code: 'NOT_FOUND' });
  return rows[0];
}
