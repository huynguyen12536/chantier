/**
 * Load seeds/current-snapshot.sql into the configured DATABASE_URL.
 * Requires migrations already applied. Idempotent (SQL truncates first).
 *
 * Usage: node --env-file=.env scripts/seed-from-snapshot.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';
import { hashPassword } from '../src/modules/auth/service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath =
  process.env.SNAPSHOT_SQL_PATH ||
  path.join(__dirname, '../seeds/current-snapshot.sql');

async function main() {
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Missing snapshot SQL: ${sqlPath}`);
  }
  await runMigrations();
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await query(sql);
  // Keep local QA credentials deterministic after each reseed.
  // This prevents snapshot hash drift from breaking documented test accounts.
  const defaultPassword = process.env.SNAPSHOT_DEFAULT_PASSWORD || '123456';
  const passwordHash = await hashPassword(defaultPassword);
  await query(
    'UPDATE profiles SET password_hash = $1, updated_at = NOW()',
    [passwordHash],
  );
  const counts = await query(`
    SELECT 'profiles' AS t, COUNT(*)::int AS n FROM profiles
    UNION ALL SELECT 'chantiers', COUNT(*)::int FROM chantiers
    UNION ALL SELECT 'affectations_chantiers', COUNT(*)::int FROM affectations_chantiers
    UNION ALL SELECT 'zones_equipe', COUNT(*)::int FROM zones_equipe
    UNION ALL SELECT 'zones_chantiers', COUNT(*)::int FROM zones_chantiers
    UNION ALL SELECT 'zones_ouvriers', COUNT(*)::int FROM zones_ouvriers
    UNION ALL SELECT 'periodes_travail', COUNT(*)::int FROM periodes_travail
    UNION ALL SELECT 'declarations_heures', COUNT(*)::int FROM declarations_heures
    ORDER BY 1
  `);
  console.log(
    JSON.stringify(
      {
        ok: true,
        snapshot: sqlPath,
        defaultPassword,
        counts: Object.fromEntries(counts.rows.map((r) => [r.t, r.n])),
      },
      null,
      2,
    ),
  );
  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await closePool();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
