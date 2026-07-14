/**
 * ReviewDecisionService — Flow E validate / reject / return / cancel.
 * Single owner of human review logic. Reuses Imp-06 period propagation (no redesign).
 */
import { AppError } from '../../../shared/errors/AppError.js';
import { withTransaction } from '../../../shared/db/pool.js';
import { assertCanReviewChantier, getChefChantierIds } from '../../../shared/authz/chefScope.js';
import { mapDeclaration, mapPeriod } from '../../timesheet/dto.js';
import * as timesheetRepo from '../../timesheet/repository.js';
import { syncPeriodsFromDeclaration } from '../../timesheet/services/periodPropagation.js';
import { periodDecisionSchema, reviewDecisionBodySchema } from '../validation.js';
import * as repo from '../repository.js';
import {
  isReviewerRole,
  getDeclarationAction,
  canPeriodDecideFrom,
} from './decisionPolicy.js';
import { recordDecisionAudit, listDeclarationHistory } from './auditService.js';
import { emitReviewEvent } from './notificationHooks.js';
import { mapAuditEvent } from '../dto.js';

function assertReviewerRole(actor) {
  if (!actor || !isReviewerRole(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

async function runDeclarationAction(id, actionKey, actor, options = {}) {
  assertReviewerRole(actor);
  const policy = getDeclarationAction(actionKey);
  if (!policy) {
    throw new AppError('Unknown review action', 400, { code: 'VALIDATION_ERROR' });
  }

  const parsed = reviewDecisionBodySchema.safeParse(options.body ?? {});
  if (!parsed.success) {
    throw new AppError('Invalid decision', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const reason = parsed.data.reason ?? null;

  const result = await withTransaction(async (client) => {
    const current = await repo.getDeclaration(client, id);
    if (!current) throw new AppError('Declaration not found', 404, { code: 'NOT_FOUND' });
    await assertCanReviewChantier(actor, current.chantier_id);

    const updated = await repo.applyDeclarationDecision(
      client,
      id,
      policy.to,
      actor.id,
      policy.fromAllowed,
    );
    if (!updated) {
      throw new AppError('Invalid transition', 409, { code: 'CONFLICT' });
    }

    if (policy.propagate) {
      await syncPeriodsFromDeclaration(client, updated, actor.id);
    }
    if (policy.deletePeriods) {
      // Flow E cancel: DELETE related periods; declaration kept (Soft Annulee).
      await repo.deletePeriodsForDeclarationKey(
        client,
        updated.user_id,
        updated.chantier_id,
        updated.date,
      );
    }

    await recordDecisionAudit(client, {
      entityType: 'declaration',
      entityId: updated.id,
      declarationId: updated.id,
      action: policy.auditAction,
      fromStatut: current.statut,
      toStatut: updated.statut,
      actorId: actor.id,
      reason,
      correlationId: options.correlationId ?? null,
    });

    return { declaration: mapDeclaration(updated), fromStatut: current.statut };
  });

  emitReviewEvent({
    type: policy.deletePeriods ? 'declaration.cancelled' : 'declaration.reviewed',
    entityId: result.declaration.id,
    statut: result.declaration.statut,
    action: policy.auditAction,
    actorId: actor.id,
  });

  return { declaration: result.declaration };
}

export async function decideDeclaration(id, input, actor, options = {}) {
  assertReviewerRole(actor);
  const parsed = reviewDecisionBodySchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new AppError('Invalid decision', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const statut = parsed.data.statut;
  if (!statut) {
    throw new AppError('statut required', 400, { code: 'VALIDATION_ERROR' });
  }
  const actionKey =
    statut === 'validee' ? 'approve' : statut === 'rejetee' ? 'reject' : statut === 'annulee' ? 'cancel' : null;
  if (!actionKey) {
    throw new AppError('Invalid decision statut', 400, { code: 'VALIDATION_ERROR' });
  }
  return runDeclarationAction(id, actionKey, actor, {
    body: { reason: parsed.data.reason },
    correlationId: options.correlationId,
  });
}

export async function approveDeclaration(id, actor, options = {}) {
  return runDeclarationAction(id, 'approve', actor, options);
}

export async function rejectDeclaration(id, actor, options = {}) {
  return runDeclarationAction(id, 'reject', actor, options);
}

/** Return for correction — CVL statut rejetee; audit action distinct. */
export async function returnDeclaration(id, actor, options = {}) {
  return runDeclarationAction(id, 'return', actor, options);
}

export async function cancelDeclaration(id, actor, options = {}) {
  return runDeclarationAction(id, 'cancel', actor, options);
}

/** Queue: soumise declarations in reviewer scope. */
export async function listQueue(actor) {
  assertReviewerRole(actor);
  if (['admin', 'administratif'].includes(actor.role)) {
    const rows = await repo.listSoumiseAll();
    return rows.map(mapDeclaration);
  }
  const chantierIds = await getChefChantierIds(actor.id);
  const rows = await repo.listSoumiseForChantiers(chantierIds);
  return rows.map(mapDeclaration);
}

/**
 * History for a declaration — reviewers in scope; worker may read own.
 */
export async function getDeclarationHistory(id, actor) {
  if (!actor?.id) throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  const declaration = await repo.getDeclarationById(id);
  if (!declaration) throw new AppError('Declaration not found', 404, { code: 'NOT_FOUND' });

  if (actor.role === 'ouvrier') {
    if (actor.id !== declaration.user_id) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
  } else if (isReviewerRole(actor.role)) {
    await assertCanReviewChantier(actor, declaration.chantier_id);
  } else {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const events = await listDeclarationHistory(id);
  return { declaration: mapDeclaration(declaration), events };
}

/**
 * Period-only decision (chef-dashboard path) — SUMMARY periods validate/reject.
 */
export async function decidePeriod(id, input, actor, options = {}) {
  assertReviewerRole(actor);
  const parsed = periodDecisionSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid period decision', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const result = await withTransaction(async (client) => {
    const period = await timesheetRepo.getPeriod(client, id);
    if (!period) throw new AppError('Period not found', 404, { code: 'NOT_FOUND' });
    await assertCanReviewChantier(actor, period.chantier_id);
    if (!canPeriodDecideFrom(period.statut)) {
      throw new AppError('Invalid transition', 409, { code: 'CONFLICT' });
    }
    const updated = await timesheetRepo.updatePeriod(client, id, {
      statut: parsed.data.statut,
      validated_by: actor.id,
      validated_at: new Date().toISOString(),
    });

    const linked = await timesheetRepo.getDeclarationByKey(
      client,
      period.user_id,
      period.chantier_id,
      period.date,
    );
    const declarationId = linked?.id ?? null;

    await recordDecisionAudit(client, {
      entityType: 'period',
      entityId: updated.id,
      declarationId,
      action: 'period_decide',
      fromStatut: period.statut,
      toStatut: updated.statut,
      actorId: actor.id,
      reason: parsed.data.reason ?? null,
      correlationId: options.correlationId ?? null,
    });

    return { period: mapPeriod(updated) };
  });

  emitReviewEvent({
    type: 'period.reviewed',
    entityId: result.period.id,
    statut: result.period.statut,
    action: 'period_decide',
    actorId: actor.id,
  });

  return result;
}

export { mapAuditEvent };
