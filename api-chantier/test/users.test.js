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

async function login(base, email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

describe('Imp-03 Users', () => {
  const adminEmail = `admin.imp03.${Date.now()}@example.com`;
  const ouvrierEmail = `ouvrier.imp03.${Date.now()}@example.com`;
  const password = 'secret12';

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom)
       VALUES ($1, $2, 'admin', 'Admin'), ($3, $2, 'ouvrier', 'Ouvrier')
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, hash, ouvrierEmail],
    );
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('admin can create user; ouvrier cannot', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const adminLogin = await login(base, adminEmail, password);
      assert.equal(adminLogin.status, 200);
      const createRes = await fetch(`${base}/api/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminLogin.body.accessToken}`,
        },
        body: JSON.stringify({
          email: `new.${Date.now()}@example.com`,
          password: 'secret12',
          role: 'chef_equipe',
          nom: 'Chef',
          prenom: 'Test',
          phone: '+33600000000',
        }),
      });
      assert.equal(createRes.status, 201);
      const created = await createRes.json();
      assert.equal(created.user.role, 'chef_equipe');
      assert.equal(created.user.phone, '+33600000000');

      const ouvLogin = await login(base, ouvrierEmail, password);
      const forbidden = await fetch(`${base}/api/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvLogin.body.accessToken}`,
        },
        body: JSON.stringify({
          email: `x.${Date.now()}@example.com`,
          password: 'secret12',
          role: 'ouvrier',
          nom: 'X',
          prenom: 'Y',
        }),
      });
      assert.equal(forbidden.status, 403);
    } finally {
      await close();
    }
  });

  it('admin cannot self-delete', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const adminLogin = await login(base, adminEmail, password);
      const me = await fetch(`${base}/api/auth/me`, {
        headers: { authorization: `Bearer ${adminLogin.body.accessToken}` },
      });
      const { user } = await me.json();
      const del = await fetch(`${base}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminLogin.body.accessToken}` },
      });
      assert.equal(del.status, 400);
      const body = await del.json();
      assert.equal(body.error.code, 'SELF_DELETE');
    } finally {
      await close();
    }
  });
});
