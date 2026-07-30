import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as affectationsService from '../../affectations/service.js';
import * as chantiersService from '../../chantiers/service.js';
import * as usersService from '../../users/service.js';
import { toErrorResponse } from '../http.js';
import { mapChantierRows } from '../mappers/hoursMapper.js';
import { pickUuid, pickEq, pickUuidList } from '../queryAllowList.js';

async function maybeEmbed(rows, query, actor) {
  const embed = String(query?.embed || '');
  if (!embed) return rows;
  const list = Array.isArray(rows) ? rows : [rows];
  let out = list;

  if (embed.includes('chantiers')) {
    const chantiers = mapChantierRows(await chantiersService.listChantiers(actor));
    const byId = new Map(chantiers.map((c) => [c.id, c]));
    out = out.map((r) => ({ ...r, chantiers: byId.get(r.chantier_id) ?? null }));
  }
  if (embed.includes('profiles')) {
    out = await embedProfiles(out, actor);
  }
  return Array.isArray(rows) ? out : out[0];
}

async function embedProfiles(rows, actor) {
  const list = Array.isArray(rows) ? rows : [rows];
  let users = [];
  try {
    users = await usersService.listUsers(actor);
  } catch {
    users = [];
  }
  const byId = new Map(users.map((u) => [u.id, u]));
  const missingIds = [
    ...new Set(list.map((r) => r.user_id).filter(Boolean)),
  ].filter((id) => !byId.has(id));
  await Promise.all(
    missingIds.map(async (id) => {
      try {
        const user = await usersService.getUser(id, actor);
        byId.set(id, user);
      } catch {
        /* skip inaccessible profile */
      }
    }),
  );
  return list.map((r) => ({ ...r, profiles: byId.get(r.user_id) ?? null }));
}

export const list = asyncHandler(async (req, res) => {
  try {
    let rows = await affectationsService.listAffectations(
      { chantier_id: pickUuid(req.query, 'chantier_id') },
      req.user,
    );
    const userId = pickUuid(req.query, 'user_id');
    if (userId) rows = rows.filter((r) => r.user_id === userId);
    const ids = pickUuidList(req.query, 'chantier_id_in');
    if (ids) {
      const set = new Set(ids);
      rows = rows.filter((r) => set.has(r.chantier_id));
    }
    const dateFinNull = pickEq(req.query, 'date_fin_is');
    if (dateFinNull === 'null') {
      rows = rows.filter((r) => r.date_fin == null);
    }
    rows = await maybeEmbed(rows, req.query, req.user);
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** DR-B-005=B / DR-P13-009=B — INSERT via assignUser only (no upsert invent). */
export const create = asyncHandler(async (req, res) => {
  try {
    const row = await affectationsService.assignUser(req.body ?? {}, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/**
 * Soft-remove when body ends assignment (date_fin);
 * otherwise re-assign via assignUser when chef_equipe_id / dates supplied (DR-P13-009=B).
 */
export const update = asyncHandler(async (req, res) => {
  try {
    const body = req.body ?? {};
    const id = req.params.id ?? body.id;

    const assignShape =
      body.user_id &&
      body.chantier_id &&
      (Object.prototype.hasOwnProperty.call(body, 'chef_equipe_id') ||
        Object.prototype.hasOwnProperty.call(body, 'date_debut') ||
        body.date_fin === null);

    if (assignShape) {
      const row = await affectationsService.assignUser(body, req.user);
      res.status(200).json(row);
      return;
    }

    if (!id) throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    const row = await affectationsService.softRemoveAffectation(id, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
