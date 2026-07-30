import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as zonesService from '../../zones/service.js';
import * as chantiersService from '../../chantiers/service.js';
import * as usersService from '../../users/service.js';
import { toErrorResponse } from '../http.js';
import { mapChantierRows } from '../mappers/hoursMapper.js';
import { pickUuid, pickEq } from '../queryAllowList.js';

/** DR-P13-005=H — optional tree compose for zones_equipe. */
async function composeZoneTree(zones, actor) {
  const chantiers = mapChantierRows(await chantiersService.listChantiers(actor));
  const chantierById = new Map(chantiers.map((c) => [c.id, c]));
  let profiles = [];
  try {
    profiles = await usersService.listUsers(actor);
  } catch {
    profiles = [];
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const out = [];
  for (const zone of zones) {
    const zc = await zonesService.listZoneChantiers(zone.id, actor);
    const zo = await zonesService.listZoneOuvriers(zone.id, actor);
    out.push({
      ...zone,
      zones_chantiers: zc.map((row) => ({
        ...row,
        chantiers: chantierById.get(row.chantier_id) ?? null,
      })),
      zones_ouvriers: zo.map((row) => ({
        ...row,
        profiles: profileById.get(row.user_id) ?? null,
      })),
    });
  }
  return out;
}

export const listZones = asyncHandler(async (req, res) => {
  try {
    let rows = await zonesService.listZones(req.user);
    const id = pickUuid(req.query, 'id');
    if (id) rows = rows.filter((r) => r.id === id);
    if (pickEq(req.query, 'compose') === 'tree' || pickEq(req.query, 'embed') === 'tree') {
      rows = await composeZoneTree(rows, req.user);
    }
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const createZone = asyncHandler(async (req, res) => {
  try {
    const row = await zonesService.createZone(req.body ?? {}, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const updateZone = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    if (!id) throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    const row = await zonesService.updateZone(id, req.body ?? {}, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const deleteZone = asyncHandler(async (req, res) => {
  try {
    const row = await zonesService.deleteZone(req.params.id, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const listZoneChantiers = asyncHandler(async (req, res) => {
  try {
    const zoneId = pickUuid(req.query, 'zone_id');
    let rows = zoneId
      ? await zonesService.listZoneChantiers(zoneId, req.user)
      : await zonesService.listAllZoneChantiers(req.user);
    if (pickEq(req.query, 'embed') === 'chantiers') {
      const chantiers = mapChantierRows(await chantiersService.listChantiers(req.user));
      const byId = new Map(chantiers.map((c) => [c.id, c]));
      rows = rows.map((r) => ({ ...r, chantiers: byId.get(r.chantier_id) ?? null }));
    }
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const listZoneOuvriers = asyncHandler(async (req, res) => {
  try {
    const userId = pickUuid(req.query, 'user_id');
    const zoneId = pickUuid(req.query, 'zone_id');
    const dateFinIs = pickEq(req.query, 'date_fin_is');

    let rows;
    if (userId) {
      rows = await zonesService.listZonesOuvriersByUser(userId, req.user);
    } else if (zoneId) {
      rows = await zonesService.listZoneOuvriers(zoneId, req.user);
    } else {
      throw new AppError('zone_id or user_id required', 400, { code: 'VALIDATION_ERROR' });
    }

    if (dateFinIs === 'null') {
      rows = rows.filter((r) => r.date_fin == null);
    }

    // AuthContext: nest zones_chantiers(chantiers)
    if (pickEq(req.query, 'compose') === 'tree' || String(req.query?.embed || '').includes('zones_chantiers')) {
      const chantiers = mapChantierRows(await chantiersService.listChantiers(req.user));
      const chantierById = new Map(chantiers.map((c) => [c.id, c]));
      const enriched = [];
      for (const zo of rows) {
        const zc = await zonesService.listZoneChantiers(zo.zone_id, req.user);
        enriched.push({
          ...zo,
          zones_chantiers: zc.map((row) => ({
            ...row,
            chantiers: chantierById.get(row.chantier_id) ?? null,
          })),
        });
      }
      rows = enriched;
    }

    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const linkChantier = asyncHandler(async (req, res) => {
  try {
    const zoneId = req.body?.zone_id ?? req.params.zoneId;
    const chantierId = req.body?.chantier_id ?? req.params.chantierId;
    if (!zoneId || !chantierId) {
      throw new AppError('zone_id and chantier_id required', 400, { code: 'VALIDATION_ERROR' });
    }
    const row = await zonesService.linkZoneChantier(zoneId, chantierId, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const unlinkChantier = asyncHandler(async (req, res) => {
  try {
    const zoneId = req.params.zoneId ?? req.query?.zone_id ?? req.body?.zone_id;
    const chantierId =
      req.params.chantierId ?? req.query?.chantier_id ?? req.body?.chantier_id;
    if (!zoneId || !chantierId) {
      throw new AppError('zone_id and chantier_id required', 400, { code: 'VALIDATION_ERROR' });
    }
    const row = await zonesService.unlinkZoneChantier(zoneId, chantierId, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const addOuvrier = asyncHandler(async (req, res) => {
  try {
    const zoneId = req.body?.zone_id;
    const userId = req.body?.user_id;
    if (!zoneId || !userId) {
      throw new AppError('zone_id and user_id required', 400, { code: 'VALIDATION_ERROR' });
    }
    const row = await zonesService.addZoneOuvrier(zoneId, userId, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** Soft-end membership when FE patches date_fin. */
export const patchOuvrier = asyncHandler(async (req, res) => {
  try {
    const zoneId = req.body?.zone_id ?? req.params.zoneId;
    const userId = req.body?.user_id ?? req.params.userId;
    if (!zoneId || !userId) {
      throw new AppError('zone_id and user_id required', 400, { code: 'VALIDATION_ERROR' });
    }
    const row = await zonesService.softRemoveZoneOuvrier(zoneId, userId, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
