import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise((r, j) => server.close((err) => (err ? j(err) : r()))),
      });
    });
  });
}

describe('Imp-04 Construction Sites', () => {
  const adminEmail = `admin.imp04.${Date.now()}@example.com`;
  const password = 'secret12';

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1, $2, 'admin') ON CONFLICT (email) DO NOTHING`,
      [adminEmail, hash],
    );
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('admin creates and cascade-deletes chantier', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const login = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      const { accessToken } = await login.json();
      const createRes = await fetch(`${base}/api/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nom: 'Site Test Imp04', adresse: '1 rue' }),
      });
      assert.equal(createRes.status, 201);
      const { chantier } = await createRes.json();
      assert.ok(chantier.code);
      assert.equal(chantier.nom, 'Site Test Imp04');

      const del = await fetch(`${base}/api/chantiers/${chantier.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      assert.equal(del.status, 200);
      const get = await fetch(`${base}/api/chantiers/${chantier.id}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      assert.equal(get.status, 404);
    } finally {
      await close();
    }
  });
});
