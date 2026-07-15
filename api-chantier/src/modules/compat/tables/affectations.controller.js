import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as affectationsService from '../../affectations/service.js';
import { toErrorResponse } from '../http.js';

export const list = asyncHandler(async (req, res) => {
  try {
    const rows = await affectationsService.listAffectations(
      { chantier_id: req.query?.chantier_id ?? null },
      req.user,
    );
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** DR-B-005=B — INSERT via assignUser only (service may ON CONFLICT internally; adapter does not invent upsert API). */
export const create = asyncHandler(async (req, res) => {
  try {
    const row = await affectationsService.assignUser(req.body ?? {}, req.user);
    res.status(201).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** Soft-remove when FE patches date_fin / ends assignment. */
export const update = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    if (!id) throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    const row = await affectationsService.softRemoveAffectation(id, req.user);
    res.status(200).json(row);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
