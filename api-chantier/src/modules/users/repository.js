/**
 * Imp-03/11 users persistence — thin SQL access (no business rewrite of Imp-05).
 */
import { query } from '../../shared/db/pool.js';
import { tenantSqlFilter, optionalCompanyFilter } from '../../shared/authz/tenantScope.js';
import { allocateMatricule, normalizeMatricule } from '../../shared/utils/matricule.js';

const PROFILE_SELECT_COLS = `p.id, p.email, p.role, p.nom, p.prenom, p.matricule, p.phone, p.actif, p.company_id, p.avatar_path, p.avatar_updated_at, p.created_at, p.updated_at, c.name AS company_name, c.slug AS company_slug`;
const PROFILE_FROM = `profiles p LEFT JOIN companies c ON c.id = p.company_id`;

export async function findAll(actor, { companyId, role } = {}) {
  const filter = optionalCompanyFilter(actor, companyId, 'p.company_id', 1);
  const clauses = [];
  const params = [...filter.params];
  if (filter.clause) clauses.push(filter.clause);
  if (role) {
    clauses.push(`p.role = $${params.length + 1}`);
    params.push(role);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT ${PROFILE_SELECT_COLS} FROM ${PROFILE_FROM} ${where} ORDER BY p.created_at DESC`,
    params,
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PROFILE_SELECT_COLS} FROM ${PROFILE_FROM} WHERE p.id = $1 LIMIT 1`,
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
  companyId,
}) {
  let resolvedMatricule = normalizeMatricule(matricule);
  if (!resolvedMatricule) {
    resolvedMatricule = await allocateMatricule();
  }
  const { rows } = await query(
    `INSERT INTO profiles (email, password_hash, role, nom, prenom, matricule, phone, company_id)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, ''), $8)
     RETURNING id`,
    [email, passwordHash, role, nom, prenom, resolvedMatricule, phone ?? '', companyId ?? null],
  );
  return findById(rows[0].id);
}

export async function updateProfile(id, fields) {
  const { rowCount } = await query(
    `UPDATE profiles SET
       email = COALESCE($2, email),
       nom = COALESCE($3, nom),
       prenom = COALESCE($4, prenom),
       phone = COALESCE($5, phone),
       role = COALESCE($6::profile_role, role),
       actif = COALESCE($7, actif),
       updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      fields.email ?? null,
      fields.nom ?? null,
      fields.prenom ?? null,
      fields.phone ?? null,
      fields.role ?? null,
      fields.actif ?? null,
    ],
  );
  if (rowCount === 0) return null;
  return findById(id);
}

export async function updateAvatar(id, avatarPath, avatarUpdatedAt) {
  const { rowCount } = await query(
    `UPDATE profiles SET
       avatar_path = $2,
       avatar_updated_at = $3,
       updated_at = NOW()
     WHERE id = $1`,
    [id, avatarPath, avatarUpdatedAt],
  );
  if (rowCount === 0) return null;
  return findById(id);
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

export async function countByCompanyAndRole(companyId) {
  const { rows } = await query(
    `SELECT role, COUNT(*)::int AS count
     FROM profiles
     WHERE company_id = $1
     GROUP BY role`,
    [companyId],
  );
  return rows;
}
