/**
 * One-shot local password reset (requested): all profiles → 123456
 * Usage: node --env-file=.env scripts/reset-passwords-123456.js
 */
import { hashPassword } from '../src/modules/auth/service.js';
import { query, closePool } from '../src/shared/db/pool.js';

const NEW_PASSWORD = '123456';

const hash = await hashPassword(NEW_PASSWORD);
const r = await query(
  'UPDATE profiles SET password_hash = $1, updated_at = NOW()',
  [hash],
);
console.log(JSON.stringify({ ok: true, updated: r.rowCount, password: NEW_PASSWORD }));
await closePool();
