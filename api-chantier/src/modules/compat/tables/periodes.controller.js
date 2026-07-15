import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as timesheetService from '../../timesheet/services/timesheetService.js';
import { toErrorResponse } from '../http.js';

export const listPeriods = asyncHandler(async (req, res) => {
  try {
    const rows = await timesheetService.listPeriods(
      {
        user_id: req.query?.user_id ?? null,
        chantier_id: req.query?.chantier_id ?? null,
        date: req.query?.date ?? null,
      },
      req.user,
    );
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const createPeriod = asyncHandler(async (req, res) => {
  try {
    const result = await timesheetService.createPeriod(req.body ?? {}, req.user);
    res.status(201).json(result.period ?? result);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const updatePeriod = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    if (!id) throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });
    const result = await timesheetService.updatePeriod(id, req.body ?? {}, req.user);
    res.status(200).json(result.period ?? result);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export const deletePeriod = asyncHandler(async (req, res) => {
  try {
    const result = await timesheetService.deletePeriod(req.params.id, req.user);
    res.status(200).json(result.period ?? result);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/** DR-B-003=C — GET only. */
export const listDeclarations = asyncHandler(async (req, res) => {
  try {
    const rows = await timesheetService.listDeclarations(
      {
        user_id: req.query?.user_id ?? null,
        chantier_id: req.query?.chantier_id ?? null,
        date: req.query?.date ?? null,
      },
      req.user,
    );
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
