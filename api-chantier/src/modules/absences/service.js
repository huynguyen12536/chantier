import { query } from '../../shared/db/pool.js';
import { AppError } from '../../shared/errors/AppError.js';

function normalizeDateKey(value) {
  if (value == null) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return s;
}

function mapAbsenceRow(row) {
  if (!row) return row;
  return {
    ...row,
    date_debut: normalizeDateKey(row.date_debut),
    date_fin: normalizeDateKey(row.date_fin),
  };
}

function canViewAbsences(actor, targetUserId) {
  if (actor.id === targetUserId) return true;
  if (actor.role === 'admin' || actor.role === 'administratif') return true;
  return actor.role === 'chef_equipe';
}

export async function listAbsences(actor, filters = {}) {
  const userId = filters.user_id ?? filters.userId;
  let sql = `SELECT a.*,
    json_build_object(
      'id', p.id, 'nom', p.nom, 'prenom', p.prenom, 'matricule', p.matricule,
      'avatar_path', p.avatar_path, 'avatar_updated_at', p.avatar_updated_at
    ) AS profiles
    FROM absences a
    JOIN profiles p ON p.id = a.user_id WHERE 1=1`;
  const params = [];

  if (userId) {
    if (!canViewAbsences(actor, userId)) {
      throw new AppError('Forbidden', 403);
    }
    params.push(userId);
    sql += ` AND a.user_id = $${params.length}`;
  } else if (actor.role === 'ouvrier') {
    params.push(actor.id);
    sql += ` AND a.user_id = $${params.length}`;
  }

  if (filters.date_debut_gte) {
    params.push(filters.date_debut_gte);
    sql += ` AND a.date_fin >= $${params.length}`;
  }
  if (filters.date_fin_lte) {
    params.push(filters.date_fin_lte);
    sql += ` AND a.date_debut <= $${params.length}`;
  }

  sql += ' ORDER BY a.date_debut DESC';
  const { rows } = await query(sql, params);
  return rows.map(mapAbsenceRow);
}

export async function getAbsence(actor, id) {
  const { rows } = await query(
    `SELECT a.*,
      json_build_object(
        'id', p.id, 'nom', p.nom, 'prenom', p.prenom, 'matricule', p.matricule,
        'avatar_path', p.avatar_path, 'avatar_updated_at', p.avatar_updated_at
      ) AS profiles
     FROM absences a
     JOIN profiles p ON p.id = a.user_id
     WHERE a.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) throw new AppError('Not found', 404);
  if (!canViewAbsences(actor, row.user_id)) throw new AppError('Forbidden', 403);
  return mapAbsenceRow(row);
}

export async function createAbsence(actor, body) {
  const userId = body.user_id ?? actor.id;
  if (userId !== actor.id && actor.role !== 'admin' && actor.role !== 'administratif') {
    throw new AppError('Forbidden', 403);
  }
  const { rows } = await query(
    `INSERT INTO absences (user_id, date_debut, date_fin, motif, commentaire)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, body.date_debut, body.date_fin, body.motif ?? null, body.commentaire ?? null],
  );
  return mapAbsenceRow(rows[0]);
}

export async function updateAbsence(actor, id, body) {
  const existing = await getAbsence(actor, id);
  if (existing.user_id !== actor.id) throw new AppError('Forbidden', 403);
  const { rows } = await query(
    `UPDATE absences SET
      date_debut = coalesce($2, date_debut),
      date_fin = coalesce($3, date_fin),
      motif = coalesce($4, motif),
      commentaire = coalesce($5, commentaire)
     WHERE id = $1 RETURNING *`,
    [id, body.date_debut, body.date_fin, body.motif, body.commentaire],
  );
  return mapAbsenceRow(rows[0]);
}

export async function deleteAbsence(actor, id) {
  const existing = await getAbsence(actor, id);
  if (existing.user_id !== actor.id) throw new AppError('Forbidden', 403);
  await query(`DELETE FROM absences WHERE id = $1`, [id]);
  return null;
}
