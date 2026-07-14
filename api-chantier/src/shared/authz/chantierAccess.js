/**
 * SUMMARY #12 — ouvrier chantier visibility: active affectation ∪ active zone membership.
 * Application-layer only (no SQL business logic).
 */
import { query, clientQuery } from '../db/pool.js';
import { AppError } from '../errors/AppError.js';

export async function hasActiveChantierAccess(userId, chantierId, client = null) {
  const run = client
    ? (sql, params) => clientQuery(client, sql, params)
    : (sql, params) => query(sql, params);

  const aff = await run(
    `SELECT 1 FROM affectations_chantiers
     WHERE user_id = $1 AND chantier_id = $2 AND date_fin IS NULL
     LIMIT 1`,
    [userId, chantierId],
  );
  if (aff.rows[0]) return true;

  const zone = await run(
    `SELECT 1
       FROM zones_ouvriers zo
       JOIN zones_chantiers zc ON zc.zone_id = zo.zone_id
      WHERE zo.user_id = $1
        AND zc.chantier_id = $2
        AND zo.date_fin IS NULL
      LIMIT 1`,
    [userId, chantierId],
  );
  return Boolean(zone.rows[0]);
}

export async function assertActiveChantierAccess(userId, chantierId, client = null) {
  const ok = await hasActiveChantierAccess(userId, chantierId, client);
  if (!ok) {
    throw new AppError('No active assignment or zone for chantier', 403, {
      code: 'FORBIDDEN_CHANTIER',
    });
  }
}
