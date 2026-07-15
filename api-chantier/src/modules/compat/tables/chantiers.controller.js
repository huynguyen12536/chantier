import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import * as chantiersService from '../../chantiers/service.js';
import { toErrorResponse } from '../http.js';

export const list = asyncHandler(async (req, res) => {
  try {
    if (req.query?.id) {
      const row = await chantiersService.getChantier(String(req.query.id));
      res.status(200).json(row);
      return;
    }
    const rows = await chantiersService.listChantiers();
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const getById = asyncHandler(async (req, res) => {
  try {
    const row = await chantiersService.getChantier(req.params.id);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const create = asyncHandler(async (req, res) => {
  try {
    const row = await chantiersService.createChantier(req.body ?? {}, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const update = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    const row = await chantiersService.updateChantier(id, req.body ?? {}, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
