import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { toErrorResponse } from '../http.js';
import * as absencesService from '../../absences/service.js';
import { pickEq, pickUuid } from '../queryAllowList.js';

export const list = asyncHandler(async (req, res) => {
  try {
    const rows = await absencesService.listAbsences(req.user, {
      user_id: pickUuid(req.query, 'user_id'),
      date_debut_gte: pickEq(req.query, 'date_debut') ?? req.query.date_debut_gte,
      date_fin_lte: pickEq(req.query, 'date_fin') ?? req.query.date_fin_lte,
    });
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const getById = asyncHandler(async (req, res) => {
  try {
    const row = await absencesService.getAbsence(req.user, req.params.id);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const create = asyncHandler(async (req, res) => {
  try {
    const row = await absencesService.createAbsence(req.user, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const update = asyncHandler(async (req, res) => {
  try {
    const row = await absencesService.updateAbsence(req.user, req.params.id, req.body ?? {});
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const remove = asyncHandler(async (req, res) => {
  try {
    await absencesService.deleteAbsence(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
