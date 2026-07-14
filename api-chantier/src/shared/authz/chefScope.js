/**
 * Chef chantier scope — replaces get_chef_chantier_ids (SECURITY DEFINER helper).
 * CVL: active affectations where chef is assigned as user_id.
 * Plus zone-owned chantiers (SUMMARY #11 zone layer).
 */
import { query } from '../db/pool.js';
import { AppError } from '../errors/AppError.js';

export async function getChefChantierIds(chefId) {
  const { rows } = await query(
    `SELECT DISTINCT chantier_id FROM (
       SELECT ac.chantier_id
         FROM affectations_chantiers ac
        WHERE ac.user_id = $1 AND ac.date_fin IS NULL
       UNION
       SELECT zc.chantier_id
         FROM zones_equipe ze
         JOIN zones_chantiers zc ON zc.zone_id = ze.id
        WHERE ze.chef_equipe_id = $1
     ) scoped`,
    [chefId],
  );
  return rows.map((r) => r.chantier_id);
}

export async function assertCanReviewChantier(actor, chantierId) {
  if (!actor?.id) {
    throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  }
  if (['admin', 'administratif'].includes(actor.role)) return;
  if (actor.role !== 'chef_equipe') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const ids = await getChefChantierIds(actor.id);
  if (!ids.includes(chantierId)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN_SCOPE' });
  }
}
