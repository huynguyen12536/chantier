import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import * as chantiersService from '../../chantiers/service.js';
import { toErrorResponse } from '../http.js';
import { fromFeChantierHours, mapChantierRows } from '../mappers/hoursMapper.js';
import { pickEq, pickUuidList } from '../queryAllowList.js';

export const list = asyncHandler(async (req, res) => {
  try {
    if (req.query?.id) {
      const row = await chantiersService.getChantier(String(req.query.id));
      res.status(200).json(mapChantierRows(row));
      return;
    }
    let rows = await chantiersService.listChantiers();
    const ids = pickUuidList(req.query, 'id_in');
    if (ids) {
      const set = new Set(ids);
      rows = rows.filter((r) => set.has(r.id));
    }
    const actif = pickEq(req.query, 'actif');
    if (actif === 'true' || actif === 'false') {
      const want = actif === 'true';
      rows = rows.filter((r) => Boolean(r.actif) === want);
    }
    res.status(200).json(mapChantierRows(rows));
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const getById = asyncHandler(async (req, res) => {
  try {
    const row = await chantiersService.getChantier(req.params.id);
    res.status(200).json(mapChantierRows(row));
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const create = asyncHandler(async (req, res) => {
  try {
    const row = await chantiersService.createChantier(
      fromFeChantierHours(req.body ?? {}),
      req.user,
    );
    res.status(201).json(mapChantierRows(row));
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const update = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    const row = await chantiersService.updateChantier(
      id,
      fromFeChantierHours(req.body ?? {}),
      req.user,
    );
    res.status(200).json(mapChantierRows(row));
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
