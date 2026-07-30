import { AppError } from '../errors/AppError.js';

export function isSystemAdmin(actor) {
  return actor?.role === 'system_admin';
}

export function tenantId(actor) {
  if (!actor) return null;
  if (isSystemAdmin(actor)) return null;
  return actor.company_id ?? null;
}

/**
 * SQL tenant filter for business queries.
 * system_admin bypasses (returns null clause = no filter) — use only on platform/monitoring routes.
 */
export function tenantSqlFilter(actor, column = 'company_id', paramIndex = 1) {
  if (isSystemAdmin(actor)) {
    return { clause: null, params: [], nextIndex: paramIndex };
  }
  const tid = tenantId(actor);
  if (!tid) {
    throw new AppError('Missing company context', 403, { code: 'FORBIDDEN_TENANT' });
  }
  return {
    clause: `${column} = $${paramIndex}`,
    params: [tid],
    nextIndex: paramIndex + 1,
  };
}

/** Optional monitoring filter for system_admin (query param only on platform routes). */
export function optionalCompanyFilter(actor, queryCompanyId, column = 'company_id', paramIndex = 1) {
  if (isSystemAdmin(actor) && queryCompanyId) {
    return {
      clause: `${column} = $${paramIndex}`,
      params: [queryCompanyId],
      nextIndex: paramIndex + 1,
    };
  }
  return tenantSqlFilter(actor, column, paramIndex);
}

export function assertSameCompany(actor, targetCompanyId) {
  if (isSystemAdmin(actor)) return;
  const tid = tenantId(actor);
  if (!tid || !targetCompanyId || tid !== targetCompanyId) {
    throw new AppError('Cross-company access denied', 403, { code: 'FORBIDDEN_TENANT' });
  }
}

export function assertCanAccessProfile(actor, targetProfile) {
  if (!targetProfile) {
    throw new AppError('User not found', 404, { code: 'NOT_FOUND' });
  }
  if (isSystemAdmin(actor)) return;
  assertSameCompany(actor, targetProfile.company_id);
}

export async function getDefaultCompanyId(queryFn) {
  const { rows } = await queryFn(
    `SELECT id FROM companies WHERE slug = 'default-company' LIMIT 1`,
  );
  return rows[0]?.id ?? null;
}
