import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../shared/db/pool.js';
import { logger } from '../shared/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export async function getAppliedMigrations() {
  await ensureMigrationsTable();
  const { rows } = await query('SELECT id FROM schema_migrations ORDER BY id');
  return new Set(rows.map((r) => r.id));
}

/**
 * Apply pending SQL migrations in lexical order (Imp-01 platform runner).
 * @returns {{ applied: string[], skipped: string[] }}
 */
export async function runMigrations() {
  await ensureMigrationsTable();
  // Serialize migration across parallel test processes / suites
  await query(`SELECT pg_advisory_lock(87251405)`);
  try {
    const files = await listMigrationFiles();
    const applied = await getAppliedMigrations();
    const newly = [];
    const skipped = [];

    for (const file of files) {
      if (applied.has(file)) {
        skipped.push(file);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      logger.info('applying migration', { file });
      await query('BEGIN');
      try {
        await query(sql);
        await query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await query('COMMIT');
        newly.push(file);
        applied.add(file);
      } catch (err) {
        await query('ROLLBACK');
        throw err;
      }
    }

    return { applied: newly, skipped };
  } finally {
    await query(`SELECT pg_advisory_unlock(87251405)`);
  }
}

export async function migrationsStatus() {
  const files = await listMigrationFiles();
  const applied = await getAppliedMigrations();
  return {
    pending: files.filter((f) => !applied.has(f)),
    applied: files.filter((f) => applied.has(f)),
  };
}
