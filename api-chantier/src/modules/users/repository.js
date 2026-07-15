/**
 * Imp-03/11 users persistence — thin SQL access (no business rewrite of Imp-05).
 */
import { query } from '../../shared/db/pool.js';

const PROFILE_COLS = `id, email, role, nom, prenom, matricule, phone, actif, created_at, updated_at`;

export async function findAll() {
  const { rows } = await query(
    `SELECT ${PROFILE_COLS} FROM profiles ORDER BY created_at DESC`,
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PROFILE_COLS} FROM profiles WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function insertProfile({
  email,
  passwordHash,
  role,
  nom,
  prenom,
  matricule,
  phone,
}) {
  const { rows } = await query(
    `INSERT INTO profiles (email, password_hash, role, nom, prenom, matricule, phone)
     VALUES ($1, $2, $3, $4, $5,
       COALESCE($6, 'M' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
       COALESCE($7, ''))
     RETURNING ${PROFILE_COLS}`,
    [email, passwordHash, role, nom, prenom, matricule ?? null, phone ?? ''],
  );
  return rows[0];
}

export async function updateProfile(id, fields) {
  const { rows } = await query(
    `UPDATE profiles SET
       email = COALESCE($2, email),
       nom = COALESCE($3, nom),
       prenom = COALESCE($4, prenom),
       phone = COALESCE($5, phone),
       role = COALESCE($6::profile_role, role),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${PROFILE_COLS}`,
    [
      id,
      fields.email ?? null,
      fields.nom ?? null,
      fields.prenom ?? null,
      fields.phone ?? null,
      fields.role ?? null,
    ],
  );
  return rows[0] ?? null;
}

export async function deleteById(id) {
  const { rowCount } = await query(`DELETE FROM profiles WHERE id = $1`, [id]);
  return rowCount > 0;
}

/** READ Imp-05 ownership — demotion / delete guards. */
export async function hasActiveChefAffectation(userId) {
  const reg = await query(`SELECT to_regclass('public.affectations_chantiers') AS exists`);
  if (!reg.rows[0]?.exists) return false;
  const { rows } = await query(
    `SELECT 1 FROM affectations_chantiers
      WHERE chef_equipe_id = $1 AND date_fin IS NULL
      LIMIT 1`,
    [userId],
  );
  return Boolean(rows[0]);
}

export async function ownsZone(userId) {
  const reg = await query(`SELECT to_regclass('public.zones_equipe') AS exists`);
  if (!reg.rows[0]?.exists) return false;
  const { rows } = await query(
    `SELECT 1 FROM zones_equipe WHERE chef_equipe_id = $1 LIMIT 1`,
    [userId],
  );
  return Boolean(rows[0]);
}
