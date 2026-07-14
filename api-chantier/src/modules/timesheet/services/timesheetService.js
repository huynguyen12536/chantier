/**
 * Timesheet application orchestration — single TX write path.
 */
import { AppError } from '../../../shared/errors/AppError.js';
import { withTransaction, query } from '../../../shared/db/pool.js';
import { periodCreateSchema, periodUpdateSchema } from '../validation.js';
import { mapPeriod, mapDeclaration } from '../dto.js';
import * as repo from '../repository.js';
import { syncDeclarationsFromPeriods } from './declarationSync.js';
import { autoApproveIfMatchesLatestValidatedShift } from './autoApproval.js';
import { decideDeclaration as reviewDecide } from '../../validation/services/reviewDecision.js';

async function assertCanWritePeriod(actor, userId) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  if (['admin', 'administratif'].includes(actor.role)) return;
  if (actor.role === 'ouvrier' && actor.id === userId) return;
  if (actor.role === 'chef_equipe') return; // scope refine Imp-07; allow team writes via validation path mainly
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
  const data = parsed.data;
  const userId = data.user_id ?? actor.id;
  await assertCanWritePeriod(actor, userId);
  if (actor.role === 'ouvrier' && data.user_id && data.user_id !== actor.id) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  return withTransaction(async (client) => {
    const period = await repo.insertPeriod(client, { ...data, user_id: userId });
    const declaration = await afterPeriodChange(client, period, actor.id);
    return { period: mapPeriod(period), declaration: mapDeclaration(declaration) };
  });
}

export async function updatePeriod(id, input, actor) {
  const parsed = periodUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid period', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  return withTransaction(async (client) => {
    const existing = await repo.getPeriod(client, id);
    if (!existing) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });
    await assertCanWritePeriod(actor, existing.user_id);

    // Resubmit: rejetee → terminee (SUMMARY #15)
    const patch = { ...parsed.data };
    if (existing.statut === 'rejetee' && patch.statut === 'terminee' && actor.id === existing.user_id) {
      /* allowed */
    } else if (['validee', 'rejetee'].includes(existing.statut) && actor.role === 'ouvrier') {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    const period = await repo.updatePeriod(client, id, patch);
    const declaration = await afterPeriodChange(client, period, actor.id);
    return { period: mapPeriod(period), declaration: mapDeclaration(declaration) };
  });
}

export async function deletePeriod(id, actor) {
  return withTransaction(async (client) => {
    const existing = await repo.getPeriod(client, id);
    if (!existing) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });
    await assertCanWritePeriod(actor, existing.user_id);
    if (['validee'].includes(existing.statut) && actor.role === 'ouvrier') {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
    await repo.deletePeriod(client, id);
    const declaration = await afterPeriodChange(client, existing, actor.id);
    return { ok: true, declaration: mapDeclaration(declaration) };
  });
}

export async function listPeriods(filters, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  const scoped =
    actor.role === 'ouvrier'
      ? { ...filters, user_id: actor.id }
      : filters;
  const { rows } = await query(
    `SELECT * FROM periodes_travail
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::uuid IS NULL OR chantier_id = $2)
       AND ($3::date IS NULL OR date = $3::date)
     ORDER BY date DESC, heure_debut`,
    [scoped.user_id ?? null, scoped.chantier_id ?? null, scoped.date ?? null],
  );
  return rows.map(mapPeriod);
}

export async function listDeclarations(filters, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  const userFilter = actor.role === 'ouvrier' ? actor.id : filters.user_id ?? null;
  const { rows } = await query(
    `SELECT * FROM declarations_heures
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::uuid IS NULL OR chantier_id = $2)
       AND ($3::date IS NULL OR date = $3::date)
     ORDER BY date DESC`,
    [userFilter, filters.chantier_id ?? null, filters.date ?? null],
  );
  return rows.map(mapDeclaration);
}

/** Validate / reject / cancel — delegates to Review & Approval (single write path). */
export async function decideDeclaration(id, input, actor) {
  return reviewDecide(id, input, actor);
}
