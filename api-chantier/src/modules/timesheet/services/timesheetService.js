/**
 * Timesheet application orchestration — Imp-06 + CVL parity P1/P2/P5.
 */
import { AppError } from '../../../shared/errors/AppError.js';
import { withTransaction, query } from '../../../shared/db/pool.js';
import { periodCreateSchema, periodUpdateSchema } from '../validation.js';
import { mapPeriod, mapDeclaration, fromPeriodRequest, fromPeriodPatch } from '../dto.js';
import * as repo from '../repository.js';
import { syncDeclarationsFromPeriods } from './declarationSync.js';
import { autoApproveIfMatchesLatestValidatedShift } from './autoApproval.js';
import { decideDeclaration as reviewDecide } from '../../validation/services/reviewDecision.js';
import { assertActiveChantierAccess } from '../../../shared/authz/chantierAccess.js';
import {
  getChefChantierIds,
  assertCanReviewChantier,
} from '../../../shared/authz/chefScope.js';
import { emitAfterPeriodMutation } from './emitTimesheetEvents.js';

/**
 * SUMMARY #11 / #12 write gate (application service).
 */
async function assertCanWritePeriod(actor, userId, chantierId) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  if (['admin', 'administratif'].includes(actor.role)) return;

  if (actor.role === 'ouvrier') {
    if (actor.id !== userId) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
    await assertActiveChantierAccess(userId, chantierId);
    return;
  }

  if (actor.role === 'chef_equipe') {
    await assertCanReviewChantier(actor, chantierId);
    // Period INSERT in CVL is own-only; team mutations use validation path
    if (actor.id !== userId) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
    await assertActiveChantierAccess(userId, chantierId);
    return;
  }

  throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
}

async function afterPeriodChange(client, period, actorId) {
  let declaration = await syncDeclarationsFromPeriods(
    client,
    period.user_id,
    period.chantier_id,
    period.date,
    actorId,
  );
  if (declaration && declaration.statut === 'soumise') {
    declaration = await autoApproveIfMatchesLatestValidatedShift(client, declaration);
  }
  return declaration;
}

export async function createPeriod(input, actor) {
  const parsed = periodCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid period', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const data = fromPeriodRequest(parsed.data);
  const userId = data.user_id ?? actor.id;
  await assertCanWritePeriod(actor, userId, data.chantier_id);

  const result = await withTransaction(async (client) => {
    const period = await repo.insertPeriod(client, { ...data, user_id: userId });
    const declaration = await afterPeriodChange(client, period, actor.id);
    return { period: mapPeriod(period), declaration: mapDeclaration(declaration) };
  });
  emitAfterPeriodMutation('created', {
    period: result.period,
    declaration: result.declaration,
    actorId: actor.id,
  });
  return result;
}

export async function updatePeriod(id, input, actor) {
  const parsed = periodUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid period', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const result = await withTransaction(async (client) => {
    const existing = await repo.getPeriod(client, id);
    if (!existing) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });

    const patch = fromPeriodPatch(parsed.data);
    const chantierId = patch.chantier_id ?? existing.chantier_id;
    const userId = patch.user_id ?? existing.user_id;

    if (['admin', 'administratif'].includes(actor.role)) {
      /* allowed */
    } else if (actor.role === 'chef_equipe') {
      await assertCanReviewChantier(actor, existing.chantier_id);
      if (chantierId !== existing.chantier_id) {
        await assertCanReviewChantier(actor, chantierId);
      }
    } else if (actor.role === 'ouvrier') {
      await assertCanWritePeriod(actor, existing.user_id, existing.chantier_id);
      if (userId !== existing.user_id || actor.id !== existing.user_id) {
        throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
      }
      if (chantierId !== existing.chantier_id) {
        await assertActiveChantierAccess(actor.id, chantierId);
      }
    } else {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    if (existing.statut === 'rejetee' && patch.statut === 'terminee' && actor.id === existing.user_id) {
      /* SUMMARY #15 resubmit */
    } else if (['validee', 'rejetee'].includes(existing.statut) && actor.role === 'ouvrier') {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    const period = await repo.updatePeriod(client, id, patch);
    const declaration = await afterPeriodChange(client, period, actor.id);
    return { period: mapPeriod(period), declaration: mapDeclaration(declaration) };
  });
  emitAfterPeriodMutation('updated', {
    period: result.period,
    declaration: result.declaration,
    actorId: actor.id,
  });
  return result;
}

export async function deletePeriod(id, actor) {
  const result = await withTransaction(async (client) => {
    const existing = await repo.getPeriod(client, id);
    if (!existing) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });

    if (['admin', 'administratif'].includes(actor.role)) {
      /* ok */
    } else if (actor.role === 'chef_equipe') {
      await assertCanReviewChantier(actor, existing.chantier_id);
    } else if (actor.role === 'ouvrier') {
      await assertCanWritePeriod(actor, existing.user_id, existing.chantier_id);
    } else {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    if (['validee'].includes(existing.statut) && actor.role === 'ouvrier') {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
    await repo.deletePeriod(client, id);
    const declaration = await afterPeriodChange(client, existing, actor.id);
    return {
      ok: true,
      declaration: mapDeclaration(declaration),
      period: mapPeriod(existing),
    };
  });
  emitAfterPeriodMutation('deleted', {
    period: result.period,
    declaration: result.declaration,
    actorId: actor.id,
  });
  return { ok: result.ok, declaration: result.declaration };
}

/** SUMMARY #11 / #12 scoped lists (P5). */
export async function listPeriods(filters, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  if (actor.role === 'ouvrier') {
    const { rows } = await query(
      `SELECT * FROM periodes_travail
       WHERE user_id = $1
         AND ($2::uuid IS NULL OR chantier_id = $2)
         AND ($3::date IS NULL OR date = $3::date)
       ORDER BY date DESC, heure_debut`,
      [actor.id, filters.chantier_id ?? null, filters.date ?? null],
    );
    return rows.map(mapPeriod);
  }

  if (actor.role === 'chef_equipe') {
    const ids = await getChefChantierIds(actor.id);
    if (ids.length === 0) return [];
    const { rows } = await query(
      `SELECT * FROM periodes_travail
       WHERE chantier_id = ANY($1::uuid[])
         AND ($2::uuid IS NULL OR user_id = $2)
         AND ($3::uuid IS NULL OR chantier_id = $3)
         AND ($4::date IS NULL OR date = $4::date)
       ORDER BY date DESC, heure_debut`,
      [ids, filters.user_id ?? null, filters.chantier_id ?? null, filters.date ?? null],
    );
    return rows.map(mapPeriod);
  }

  // admin / administratif — full business scope
  const { rows } = await query(
    `SELECT * FROM periodes_travail
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::uuid IS NULL OR chantier_id = $2)
       AND ($3::date IS NULL OR date = $3::date)
     ORDER BY date DESC, heure_debut`,
    [filters.user_id ?? null, filters.chantier_id ?? null, filters.date ?? null],
  );
  return rows.map(mapPeriod);
}

export async function listDeclarations(filters, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  if (actor.role === 'ouvrier') {
    const { rows } = await query(
      `SELECT * FROM declarations_heures
       WHERE user_id = $1
         AND ($2::uuid IS NULL OR chantier_id = $2)
         AND ($3::date IS NULL OR date = $3::date)
       ORDER BY date DESC`,
      [actor.id, filters.chantier_id ?? null, filters.date ?? null],
    );
    return rows.map(mapDeclaration);
  }

  if (actor.role === 'chef_equipe') {
    const ids = await getChefChantierIds(actor.id);
    if (ids.length === 0) return [];
    const { rows } = await query(
      `SELECT * FROM declarations_heures
       WHERE chantier_id = ANY($1::uuid[])
         AND ($2::uuid IS NULL OR user_id = $2)
         AND ($3::uuid IS NULL OR chantier_id = $3)
         AND ($4::date IS NULL OR date = $4::date)
       ORDER BY date DESC`,
      [ids, filters.user_id ?? null, filters.chantier_id ?? null, filters.date ?? null],
    );
    return rows.map(mapDeclaration);
  }

  const { rows } = await query(
    `SELECT * FROM declarations_heures
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::uuid IS NULL OR chantier_id = $2)
       AND ($3::date IS NULL OR date = $3::date)
     ORDER BY date DESC`,
    [filters.user_id ?? null, filters.chantier_id ?? null, filters.date ?? null],
  );
  return rows.map(mapDeclaration);
}

export async function decideDeclaration(id, input, actor) {
  return reviewDecide(id, input, actor);
}
