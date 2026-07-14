import pg from 'pg';
import { env } from '../../config/env.js';

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function pingDatabase() {
  const result = await query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
