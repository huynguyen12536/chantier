/**
 * Imp-08 Payroll Export — Flow F.
 * Authorized read of validated periods only (SUMMARY / SHARED rule 14).
 * Spreadsheet/CSV formatting remains FE responsibility (frozen contract).
 */
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';
import { getChefChantierIds } from '../../shared/authz/chefScope.js';

const rangeSchema = z.object({
  from: z.string().min(8),
  to: z.string().min(8),
});

function assertExporter(actor) {
  if (!actor || !['admin', 'administratif', 'chef_equipe'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
}

async function resolveChantierScope(actor) {
  if (['admin', 'administratif'].includes(actor.role)) return null; // all
  const ids = await getChefChantierIds(actor.id);
  return ids;
}

export async function listPayrollPeriods(queryParams, actor) {
  assertExporter(actor);
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

  return {
    from,
    to,
    periods: rows.map((r) => ({
      id: r.id,
      date: r.date,
      user_id: r.user_id,
      chantier_id: r.chantier_id,
      heure_debut: r.heure_debut,
      heure_fin: r.heure_fin,
      panier: r.panier,
      deplacement: r.deplacement,
      statut: r.statut,
      profiles: { nom: r.user_nom, prenom: r.user_prenom },
      chantiers: { nom: r.chantier_nom, adresse: r.chantier_adresse },
    })),
  };
}

/** Dashboard stats (FE export.tsx loadStats) — scoped; not limited to validee-only for counts. */
export async function listExportStats(actor) {
  assertExporter(actor);
  const scope = await resolveChantierScope(actor);
  if (Array.isArray(scope) && scope.length === 0) {
    return { total_declarations: 0, validees: 0, en_attente: 0 };
  }
  const { rows } = await query(
    `SELECT statut, COUNT(*)::int AS n
       FROM periodes_travail
      WHERE heure_fin IS NOT NULL
        AND ($1::uuid[] IS NULL OR chantier_id = ANY($1::uuid[]))
        AND statut IN ('terminee', 'validee')
      GROUP BY statut`,
    [scope],
  );
  const by = Object.fromEntries(rows.map((r) => [r.statut, r.n]));
  const validees = by.validee ?? 0;
  const en_attente = by.terminee ?? 0;
  return {
    total_declarations: validees + en_attente,
    validees,
    en_attente,
  };
}
