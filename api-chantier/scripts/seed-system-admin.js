/**
 * Seed system_admin user for local/dev (run after migrations).
 * Usage: node scripts/seed-system-admin.js
 */
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import { allocateMatricule, normalizeMatricule } from '../src/shared/utils/matricule.js';

const email = process.env.SYSTEM_ADMIN_EMAIL ?? 'system.admin@local.test';
const password = process.env.SYSTEM_ADMIN_PASSWORD ?? '123456';

async function main() {
  const hash = await hashPassword(password);
  const existing = await query(
    `SELECT id FROM profiles WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  if (existing.rows[0]) {
    const { rows: profileRows } = await query(
      `SELECT matricule FROM profiles WHERE id = $1 LIMIT 1`,
      [existing.rows[0].id],
    );
    const matricule =
      normalizeMatricule(profileRows[0]?.matricule) ?? (await allocateMatricule());
    await query(
      `UPDATE profiles
       SET role = 'system_admin', company_id = NULL, password_hash = $2, actif = true, matricule = $3
       WHERE id = $1`,
      [existing.rows[0].id, hash, matricule],
    );
    console.log(JSON.stringify({ updated: email, matricule }));
  } else {
    const matricule = await allocateMatricule();
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, matricule, company_id, actif)
       VALUES ($1, $2, 'system_admin', 'System', 'Admin', $3, NULL, true)`,
      [email, hash, matricule],
    );
    console.log(JSON.stringify({ created: email, matricule }));
  }
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
