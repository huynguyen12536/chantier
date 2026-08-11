import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';
import { tenantSqlFilter, assertSameCompany, tenantId } from '../../shared/authz/tenantScope.js';

const upsertSchema = z.object({
  code: z.string().min(1).max(64).optional(),
  nom: z.string().min(1).max(200),
  adresse: z.string().max(500).optional().nullable(),
  date_debut: z.string().optional().nullable(),
  date_fin: z.string().optional().nullable(),
  heure_debut_matin: z.string().optional().nullable(),
  heure_fin_matin: z.string().optional().nullable(),
  heure_debut_apres_midi: z.string().optional().nullable(),
  heure_fin_apres_midi: z.string().optional().nullable(),
  actif: z.boolean().optional(),
});

function mapRow(row) {
  return {
    id: row.id,
    code: row.code,
    nom: row.nom,
    adresse: row.adresse,
    date_debut: row.date_debut,
    date_fin: row.date_fin,
    heure_debut_matin: row.heure_debut_matin,
    heure_fin_matin: row.heure_fin_matin,
    heure_debut_apres_midi: row.heure_debut_apres_midi,
    heure_fin_apres_midi: row.heure_fin_apres_midi,
    actif: row.actif,
    company_id: row.company_id,
    source: row.source ?? 'standard',
    divers_statut: row.divers_statut ?? null,
    created_by: row.created_by ?? null,
    divers_creation_reason: row.divers_creation_reason ?? null,
    divers_reviewed_by: row.divers_reviewed_by ?? null,
    divers_reviewed_at: row.divers_reviewed_at ?? null,
    divers_rejection_reason: row.divers_rejection_reason ?? null,
    created_at: row.created_at ?? null,
  };
}

async function nextCode(_companyId) {
  // codes are globally unique (chantiers_code_key)
  const { rows } = await query(
    `SELECT code FROM chantiers WHERE code ~ '^C[0-9]+$' ORDER BY code DESC LIMIT 200`,
  );
  let max = 0;
  for (const r of rows) {
    const m = String(r.code).match(/(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `C${String(max + 1).padStart(4, '0')}`;
}

export async function listChantiers(actor) {
  const filter = tenantSqlFilter(actor, 'company_id', 1);
  const where = filter.clause ? `WHERE ${filter.clause}` : '';
  const { rows } = await query(
    `SELECT * FROM chantiers ${where} ORDER BY code`,
    filter.params,
  );
  return rows.map(mapRow);
}

export async function getChantier(id, actor) {
  const { rows } = await query(`SELECT * FROM chantiers WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Chantier not found', 404, { code: 'NOT_FOUND' });
  if (actor) assertSameCompany(actor, rows[0].company_id);
  return mapRow(rows[0]);
}

export function normalizeChantierName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export async function assertUniqueChantierName(nom, { companyId, excludeId, client } = {}) {
  const cleaned = String(nom ?? '').trim().replace(/\s+/g, ' ');
  const normalized = normalizeChantierName(cleaned);
  if (!normalized) {
    throw new AppError('chantier_name_required', 400, { code: 'VALIDATION_ERROR' });
  }
  const run = client
    ? (text, params) => client.query(text, params)
    : (text, params) => query(text, params);
  const params = [normalized, companyId ?? null];
  let sql = `SELECT id FROM chantiers
     WHERE lower(regexp_replace(btrim(nom), '[[:space:]]+', ' ', 'g')) = $1
       AND ($2::uuid IS NULL OR company_id = $2)`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $3`;
  }
  sql += ' LIMIT 1';
  const { rows } = await run(sql, params);
  if (rows[0]) {
    throw new AppError('chantier_name_already_exists', 409, { code: 'CONFLICT' });
  }
  return cleaned;
}

function rejectClientCompanyOverride(input, actor) {
  if (input?.company_id == null) return;
  const companyId = tenantId(actor);
  if (input.company_id !== companyId) {
    throw new AppError('Cross-company access denied', 403, { code: 'FORBIDDEN_TENANT' });
  }
}

/** Create — company admin only */
export async function createChantier(input, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  rejectClientCompanyOverride(input, actor);
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid chantier payload', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  const companyId = tenantId(actor);
  const nom = await assertUniqueChantierName(data.nom, { companyId });
  const code = data.code?.trim() || (await nextCode(companyId));
  try {
    const { rows } = await query(
      `INSERT INTO chantiers (
         code, nom, adresse, date_debut, date_fin,
         heure_debut_matin, heure_fin_matin, heure_debut_apres_midi, heure_fin_apres_midi, actif, company_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, TRUE), $11)
       RETURNING *`,
      [
        code,
        nom,
        data.adresse ?? null,
        data.date_debut ?? null,
        data.date_fin ?? null,
        data.heure_debut_matin ?? null,
        data.heure_fin_matin ?? null,
        data.heure_debut_apres_midi ?? null,
        data.heure_fin_apres_midi ?? null,
        data.actif ?? true,
        companyId,
      ],
    );
    return mapRow(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new AppError('Code already exists', 409, { code: 'CONFLICT' });
    throw err;
  }
}

export async function updateChantier(id, input, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const parsed = upsertSchema.partial().safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid chantier payload', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  if (data.nom !== undefined && (!data.nom || !String(data.nom).trim())) {
    throw new AppError('Invalid chantier payload', 400, { code: 'VALIDATION_ERROR' });
  }
  const existing = await getChantier(id, actor);
  let nextNom = data.nom ?? null;
  if (nextNom != null) {
    nextNom = await assertUniqueChantierName(nextNom, {
      companyId: existing.company_id,
      excludeId: id,
    });
  }
  const { rows } = await query(
    `UPDATE chantiers SET
       nom = COALESCE($2, nom),
       adresse = COALESCE($3, adresse),
       date_debut = COALESCE($4, date_debut),
       date_fin = COALESCE($5, date_fin),
       heure_debut_matin = COALESCE($6, heure_debut_matin),
       heure_fin_matin = COALESCE($7, heure_fin_matin),
       heure_debut_apres_midi = COALESCE($8, heure_debut_apres_midi),
       heure_fin_apres_midi = COALESCE($9, heure_fin_apres_midi),
       actif = COALESCE($10, actif),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      nextNom,
      data.adresse ?? null,
      data.date_debut ?? null,
      data.date_fin ?? null,
      data.heure_debut_matin ?? null,
      data.heure_fin_matin ?? null,
      data.heure_debut_apres_midi ?? null,
      data.heure_fin_apres_midi ?? null,
      data.actif ?? null,
    ],
  );
  if (!rows[0]) throw new AppError('Chantier not found', 404, { code: 'NOT_FOUND' });
  return mapRow(rows[0]);
}

export async function deleteChantierCascade(id, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const exists = await getChantier(id, actor);
  await query('BEGIN');
  try {
    for (const table of [
      'periodes_travail',
      'declarations_heures',
      'zones_chantiers',
      'affectations_chantiers',
    ]) {
      const reg = await query(`SELECT to_regclass($1) AS t`, [`public.${table}`]);
      if (reg.rows[0]?.t) {
        await query(`DELETE FROM ${table} WHERE chantier_id = $1`, [id]);
      }
    }
    await query(`DELETE FROM chantiers WHERE id = $1`, [id]);
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
  return { ok: true, deleted: exists.id };
}
