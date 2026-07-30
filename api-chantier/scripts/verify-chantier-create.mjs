/**
 * Smoke test: admin creates chantier via compat POST /rest/v1/chantiers
 */
import { hashPassword } from '../src/modules/auth/service.js';
import { query, closePool } from '../src/shared/db/pool.js';

const email = process.env.ADMIN_EMAIL ?? 'test.admin.cross@local.test';
const password = process.env.ADMIN_PASS ?? '123456';
const base = process.env.API_BASE ?? 'http://localhost:3001';

async function main() {
  const hash = await hashPassword(password);
  await query(`UPDATE profiles SET password_hash = $1 WHERE lower(email) = lower($2)`, [
    hash,
    email,
  ]);

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`login failed: ${loginRes.status} ${JSON.stringify(loginBody)}`);
  }

  const code = `SMK${Date.now().toString().slice(-6)}`;
  const createRes = await fetch(`${base}/rest/v1/chantiers`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${loginBody.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ code, nom: `Smoke ${code}`, adresse: '1 rue Test' }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`create failed: ${createRes.status} ${JSON.stringify(createBody)}`);
  }

  console.log(
    JSON.stringify({
      ok: true,
      userCompanyId: loginBody.user?.company_id,
      chantierCompanyId: createBody.company_id,
      chantierId: createBody.id,
      code: createBody.code,
    }),
  );
  await closePool();
}

main().catch(async (err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  await closePool().catch(() => {});
  process.exit(1);
});
