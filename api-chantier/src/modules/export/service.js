/**
 * Imp-08 Payroll Export & Reporting — Flow F / SUMMARY #14.
 * Read-only. Does not mutate timesheet/review state.
 * CSV/spreadsheet formatting remains FE (frozen contract).
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';
import { getChefChantierIds } from '../../shared/authz/chefScope.js';
import { durationHours } from '../timesheet/domain/timeUtility.js';
import { mapPayrollPeriod, mapDeclarationExport } from './dto.js';

const rangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const userRangeSchema = rangeSchema.extend({
  user_id: z.string().uuid(),
});

function assertExporter(actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

async function resolveChantierScope(actor) {
  if (['admin', 'administratif'].includes(actor.role)) return null; // all
  return getChefChantierIds(actor.id);
}

function parseRange(queryParams) {
  const parsed = rangeSchema.safeParse({
    from: queryParams.from,
    to: queryParams.to,
  });
  if (!parsed.success) {
    throw new AppError('from and to required (YYYY-MM-DD)', 400, {
      code: 'VALIDATION_ERROR',
    });
  }
  const { from, to } = parsed.data;
  if (from > to) {
    throw new AppError('Invalid date range', 400, { code: 'VALIDATION_ERROR' });
  }
  return { from, to };
}

/**
 * Flow F — validated periods in date range (SUMMARY #14).
 */
export async function listPayrollPeriods(queryParams, actor) {
  assertExporter(actor);
  const { from, to } = parseRange(queryParams);

  const scope = await resolveChantierScope(actor);
  if (Array.isArray(scope) && scope.length === 0) {
    return { from, to, periods: [] };
  }

  const { rows } = await query(
    `SELECT
       p.id, p.date, p.user_id, p.chantier_id,
       p.heure_debut, p.heure_fin, p.panier, p.deplacement, p.statut,
       pr.nom AS user_nom, pr.prenom AS user_prenom,
       c.nom AS chantier_nom, c.adresse AS chantier_adresse
     FROM periodes_travail p
     JOIN profiles pr ON pr.id = p.user_id
     JOIN chantiers c ON c.id = p.chantier_id
     WHERE p.statut = 'validee'
       AND p.date >= $1::date AND p.date <= $2::date
       AND ($3::uuid[] IS NULL OR p.chantier_id = ANY($3::uuid[]))
     ORDER BY p.date ASC, pr.nom ASC, p.heure_debut ASC`,
    [from, to, scope],
  );

  return { from, to, periods: rows.map(mapPayrollPeriod) };
}

/**
 * FE export.tsx loadStats — counts + total_heures.
 * total_heures = wall-clock (heure_fin - heure_debut), matching
 * computeChantierHoursBreakdown(...).totalHeures — NOT normales+HS from splitHours.
 * Closed periods (heure_fin NOT NULL) in exporter scope.
 */
export async function listExportStats(actor) {
  assertExporter(actor);
  const scope = await resolveChantierScope(actor);
  if (Array.isArray(scope) && scope.length === 0) {
    return { total_declarations: 0, validees: 0, en_attente: 0, total_heures: 0 };
  }

  const { rows } = await query(
    `SELECT p.statut, p.heure_debut, p.heure_fin
     FROM periodes_travail p
     WHERE p.heure_fin IS NOT NULL
       AND ($1::uuid[] IS NULL OR p.chantier_id = ANY($1::uuid[]))`,
    [scope],
  );

  let validees = 0;
  let en_attente = 0;
  let total_heures = 0;

  for (const r of rows) {
    if (r.statut === 'validee') validees += 1;
    if (r.statut === 'terminee') en_attente += 1;
    if (r.statut === 'validee' || r.statut === 'terminee') {
      total_heures += durationHours(r.heure_debut, r.heure_fin);
    }
  }

  return {
    // FE contract: length of closed rows (heure_fin not null)
    total_declarations: rows.length,
    validees,
    en_attente,
    total_heures: Math.round(total_heures * 100) / 100,
  };
}

/**
 * FE user-payroll.tsx — declarations for one user in date range (reporting read).
 * Exporter roles only; chef scoped to supervised chantiers.
 */
export async function listUserDeclarations(queryParams, actor) {
  assertExporter(actor);
  const parsed = userRangeSchema.safeParse({
    from: queryParams.from,
    to: queryParams.to,
    user_id: queryParams.user_id,
  });
  if (!parsed.success) {
    throw new AppError('user_id, from, to required', 400, {
      code: 'VALIDATION_ERROR',
    });
  }
  const { from, to, user_id: userId } = parsed.data;
  if (from > to) {
    throw new AppError('Invalid date range', 400, { code: 'VALIDATION_ERROR' });
  }

  const scope = await resolveChantierScope(actor);
  if (Array.isArray(scope) && scope.length === 0) {
    return { from, to, user_id: userId, declarations: [] };
  }

  const { rows } = await query(
    `SELECT
       d.id, d.date, d.user_id, d.chantier_id,
       d.heures_normales, d.heures_supplementaires,
       d.nb_paniers, d.nb_deplacements, d.statut,
       c.nom AS chantier_nom, c.code AS chantier_code
     FROM declarations_heures d
     JOIN chantiers c ON c.id = d.chantier_id
     WHERE d.user_id = $1
       AND d.date >= $2::date AND d.date <= $3::date
       AND ($4::uuid[] IS NULL OR d.chantier_id = ANY($4::uuid[]))
     ORDER BY d.date DESC`,
    [userId, from, to, scope],
  );

  return {
    from,
    to,
    user_id: userId,
    declarations: rows.map(mapDeclarationExport),
  };
}
