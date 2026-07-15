import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as zonesService from '../../zones/service.js';
import { toErrorResponse } from '../http.js';

export const listZones = asyncHandler(async (req, res) => {
  try {
    const rows = await zonesService.listZones(req.user);
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
