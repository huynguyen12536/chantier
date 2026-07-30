/**
 * Employee matricule allocation — legacy CVL format: USR + 6 digits.
 */
import { query } from '../db/pool.js';

export function normalizeMatricule(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** Legacy edge create-user format: USR + last 6 digits of timestamp. */
export function formatMatriculeFromTimestamp(ts = Date.now()) {
  return `USR${String(ts).slice(-6)}`;
}

export async function allocateMatricule(runQuery = query) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = formatMatriculeFromTimestamp(Date.now() + attempt);
    const { rows } = await runQuery(
      `SELECT 1 FROM profiles WHERE matricule = $1 LIMIT 1`,
      [candidate],
    );
    if (!rows[0]) return candidate;
  }
  const rand = Math.floor(Math.random() * 1_000_000);
  return `USR${String(rand).padStart(6, '0')}`;
}
