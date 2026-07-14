/**
 * ReviewDecisionService — Flow E validate / reject / cancel.
 * Replaces manual FE updates + trigger_sync_periods_from_declaration path.
 * Reuses Timesheet period propagation; single write path (R-09).
 */
import { AppError } from '../../../shared/errors/AppError.js';
import { withTransaction, query } from '../../../shared/db/pool.js';
import { assertCanReviewChantier, getChefChantierIds } from '../../../shared/authz/chefScope.js';
import { mapDeclaration, mapPeriod } from '../../timesheet/dto.js';
import * as timesheetRepo from '../../timesheet/repository.js';
import { syncPeriodsFromDeclaration } from '../../timesheet/services/periodPropagation.js';
import { decideSchema } from '../../timesheet/validation.js';
import { periodDecisionSchema } from '../validation.js';

function assertReviewerRole(actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

async function loadDeclaration(client, id) {
  const { rows } = await client.query(`SELECT * FROM declarations_heures WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Conditional decision update — concurrency from soumise (approve/reject).
 */
async function applyDeclarationDecision(client, id, statut, actorId) {
  if (statut === 'annulee') {
    const { rows } = await client.query(
      `UPDATE declarations_heures SET
         statut = 'annulee',
         validated_by = $2,
         validated_at = NOW(),
         updated_at = NOW()
       WHERE id = $1
         AND statut IN ('soumise', 'validee')
       RETURNING *`,
      [id, actorId],
    );
    return rows[0] ?? null;
  }
  const { rows } = await client.query(
    `UPDATE declarations_heures SET
       statut = $2,
       validated_by = $3,
       validated_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
       AND statut = 'soumise'
     RETURNING *`,
    [id, statut, actorId],
  );
  return rows[0] ?? null;
}

export async function decideDeclaration(id, input, actor) {
  assertReviewerRole(actor);
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid decision', 400, { code: 'VALIDATION_ERROR' });
  }
  const target = parsed.data.statut;

  return withTransaction(async (client) => {
    const current = await loadDeclaration(client, id);
    if (!current) throw new AppError('Declaration not found', 404, { code: 'NOT_FOUND' });
    await assertCanReviewChantier(actor, current.chantier_id);

    const updated = await applyDeclarationDecision(client, id, target, actor.id);
    if (!updated) {
      throw new AppError('Invalid transition', 409, { code: 'CONFLICT' });
    }

    if (['validee', 'rejetee'].includes(updated.statut)) {
      await syncPeriodsFromDeclaration(client, updated, actor.id);
    }
    if (updated.statut === 'annulee') {
      // Flow E cancel: DELETE related periods (CVL validation.tsx). Declaration kept (Soft Annulee).
      await client.query(
        `DELETE FROM periodes_travail
         WHERE user_id = $1 AND chantier_id = $2 AND date = $3`,
        [updated.user_id, updated.chantier_id, updated.date],
      );
    }
    return { declaration: mapDeclaration(updated) };
  });
}

export async function approveDeclaration(id, actor) {
  return decideDeclaration(id, { statut: 'validee' }, actor);
}

export async function rejectDeclaration(id, actor) {
  return decideDeclaration(id, { statut: 'rejetee' }, actor);
}

export async function cancelDeclaration(id, actor) {
  return decideDeclaration(id, { statut: 'annulee' }, actor);
}

/** Queue: soumise declarations in reviewer scope. */
export async function listQueue(actor) {
  assertReviewerRole(actor);
  if (['admin', 'administratif'].includes(actor.role)) {
    const { rows } = await query(
      `SELECT * FROM declarations_heures
       WHERE statut = 'soumise'
       ORDER BY date DESC, created_at DESC`,
    );
    return rows.map(mapDeclaration);
  }
  const chantierIds = await getChefChantierIds(actor.id);
  if (chantierIds.length === 0) return [];
  const { rows } = await query(
    `SELECT * FROM declarations_heures
     WHERE statut = 'soumise'
       AND chantier_id = ANY($1::uuid[])
     ORDER BY date DESC, created_at DESC`,
    [chantierIds],
  );
  return rows.map(mapDeclaration);
}

/**
 * Period-only decision (chef-dashboard path) — SUMMARY periods validate/reject.
 */
export async function decidePeriod(id, input, actor) {
  assertReviewerRole(actor);
  const parsed = periodDecisionSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid period decision', 400, { code: 'VALIDATION_ERROR' });
  }
  return withTransaction(async (client) => {
    const period = await timesheetRepo.getPeriod(client, id);
    if (!period) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });
    await assertCanReviewChantier(actor, period.chantier_id);
    if (!['terminee', 'en_cours'].includes(period.statut)) {
      throw new AppError('Invalid transition', 409, { code: 'CONFLICT' });
    }
    const updated = await timesheetRepo.updatePeriod(client, id, {
      statut: parsed.data.statut,
      validated_by: actor.id,
      validated_at: new Date().toISOString(),
    });
    return { period: mapPeriod(updated) };
  });
}
