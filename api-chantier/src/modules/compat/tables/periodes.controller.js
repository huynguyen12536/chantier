import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as timesheetService from '../../timesheet/services/timesheetService.js';
import * as chantiersService from '../../chantiers/service.js';
import * as usersService from '../../users/service.js';
import {
  approveDeclaration,
  rejectDeclaration,
  cancelDeclaration,
} from '../../validation/services/reviewDecision.js';
import { toErrorResponse } from '../http.js';
import { mapChantierRows } from '../mappers/hoursMapper.js';
import { pickUuid, pickDate, pickEq, pickUuidList } from '../queryAllowList.js';

async function embedPeriodOrDecl(rows, query, kind) {
  const embed = String(query?.embed || '');
  if (!embed) return rows;
  const list = Array.isArray(rows) ? rows : [rows];
  let out = list;
  if (embed.includes('chantiers')) {
    const chantiers = mapChantierRows(await chantiersService.listChantiers());
    const byId = new Map(chantiers.map((c) => [c.id, c]));
    out = out.map((r) => ({ ...r, chantiers: byId.get(r.chantier_id) ?? null }));
  }
  if (embed.includes('profiles')) {
    let users = [];
    try {
      users = await usersService.listUsers();
    } catch {
      users = [];
    }
    const byId = new Map(users.map((u) => [u.id, u]));
    out = out.map((r) => ({ ...r, profiles: byId.get(r.user_id) ?? null }));
  }
  return Array.isArray(rows) ? out : out[0];
}

function applyExtraFilters(rows, query) {
  let out = rows;
  const userIds = pickUuidList(query, 'user_id_in');
  if (userIds) {
    const set = new Set(userIds);
    out = out.filter((r) => set.has(r.user_id));
  }
  const chantierIds = pickUuidList(query, 'chantier_id_in');
  if (chantierIds) {
    const set = new Set(chantierIds);
    out = out.filter((r) => set.has(r.chantier_id));
  }
  const dateGte = pickDate(query, 'date_gte');
  if (dateGte) out = out.filter((r) => String(r.date) >= dateGte);
  const dateLte = pickDate(query, 'date_lte');
  if (dateLte) out = out.filter((r) => String(r.date) <= dateLte);
  const statut = pickEq(query, 'statut');
  if (statut) out = out.filter((r) => r.statut === statut);
  const statutNeq = pickEq(query, 'statut_neq');
  if (statutNeq) out = out.filter((r) => r.statut !== statutNeq);
  const statutIn = pickEq(query, 'statut_in');
  if (statutIn) {
    const set = new Set(statutIn.split(',').map((s) => s.trim()));
    out = out.filter((r) => set.has(r.statut));
  }
  const heureFinNotNull = pickEq(query, 'heure_fin_not');
  if (heureFinNotNull === 'null') {
    out = out.filter((r) => r.heure_fin != null);
  }
  const datesIn = pickEq(query, 'date_in');
  if (datesIn) {
    const set = new Set(datesIn.split(',').map((s) => s.trim()).filter(Boolean));
    out = out.filter((r) => set.has(String(r.date)));
  }
  return out;
}

export const listPeriods = asyncHandler(async (req, res) => {
  try {
    let rows = await timesheetService.listPeriods(
      {
        user_id: pickUuid(req.query, 'user_id'),
        chantier_id: pickUuid(req.query, 'chantier_id'),
        date: pickDate(req.query, 'date'),
      },
      req.user,
    );
    rows = applyExtraFilters(rows, req.query);
    rows = await embedPeriodOrDecl(rows, req.query, 'period');
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

export const listDeclarations = asyncHandler(async (req, res) => {
  try {
    let rows = await timesheetService.listDeclarations(
      {
        user_id: pickUuid(req.query, 'user_id'),
        chantier_id: pickUuid(req.query, 'chantier_id'),
        date: pickDate(req.query, 'date'),
      },
      req.user,
    );
    rows = applyExtraFilters(rows, req.query);
    rows = await embedPeriodOrDecl(rows, req.query, 'declaration');
    res.status(200).json(rows);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

/**
 * DR-P13-003=A — declarations PATCH → Imp-07 only (no raw SQL / no Imp-12 reopen).
 * Maps FE statut writes to approve | reject | cancel | return.
 */
export const patchDeclaration = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id ?? req.body?.id;
    if (!id) throw new AppError('id requis', 400, { code: 'VALIDATION_ERROR' });

    const statut = req.body?.statut;
    const reason = req.body?.reason ?? req.body?.commentaire ?? null;
    const opts = { body: { reason }, correlationId: req.correlationId };

    let result;
    if (statut === 'validee') {
      result = await approveDeclaration(id, req.user, opts);
    } else if (statut === 'rejetee') {
      result = await rejectDeclaration(id, req.user, opts);
    } else if (statut === 'annulee') {
      result = await cancelDeclaration(id, req.user, opts);
    } else {
      throw new AppError('Unsupported declaration statut for PATCH', 400, {
        code: 'VALIDATION_ERROR',
      });
    }

    const declaration = result.declaration ?? result;
    res.status(200).json(declaration);
  } catch (err) {
    const mapped = toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});
