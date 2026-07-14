import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';
import { query } from '../../shared/db/pool.js';

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
  };
}

async function nextCode() {
  const { rows } = await query(`SELECT code FROM chantiers ORDER BY code DESC LIMIT 50`);
  let max = 0;
  for (const r of rows) {
    const m = String(r.code).match(/(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `C${String(max + 1).padStart(4, '0')}`;
}

export async function listChantiers() {
  const { rows } = await query(`SELECT * FROM chantiers ORDER BY code`);
  return rows.map(mapRow);
}

export async function getChantier(id) {
  const { rows } = await query(`SELECT * FROM chantiers WHERE id = $1`, [id]);
  if (!rows[0]) throw new AppError('Chantier not found', 404, { code: 'NOT_FOUND' });
  return mapRow(rows[0]);
}

/** Create — CVL: admin or administratif */
export async function createChantier(input, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('Invalid chantier payload', 400, {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  const code = data.code?.trim() || (await nextCode());
  try {
    const { rows } = await query(
      `INSERT INTO chantiers (
         code, nom, adresse, date_debut, date_fin,
         heure_debut_matin, heure_fin_matin, heure_debut_apres_midi, heure_fin_apres_midi, actif
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, TRUE))
       RETURNING *`,
      [
        code,
        data.nom,
        data.adresse ?? null,
        data.date_debut ?? null,
        data.date_fin ?? null,
        data.heure_debut_matin ?? null,
        data.heure_fin_matin ?? null,
        data.heure_debut_apres_midi ?? null,
        data.heure_fin_apres_midi ?? null,
        data.actif ?? true,
      ],
    );
    return mapRow(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new AppError('Code already exists', 409, { code: 'CONFLICT' });
    throw err;
  }
}

export async function updateChantier(id, input, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
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
  await getChantier(id);
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
      data.nom ?? null,
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

/**
 * Cascade delete — CVL RPC delete_chantier_cascade (SUMMARY §5 #13).
 * Order: periods → declarations → zones_chantiers → affectations → chantier
 * Child tables may not exist until later Imp modules — delete what exists.
 */
export async function deleteChantierCascade(id, actor) {
  if (!actor || !['admin', 'administratif'].includes(actor.role)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const exists = await getChantier(id);
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
