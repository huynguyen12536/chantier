/**
 * Imp-12 Wave A — compatibility adapters (Edge / RPC / profiles table).
 */
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
  assert.equal(res.status, 200);
  return (await res.json()).accessToken;
}

describe('Imp-12 Wave A compatibility', () => {
  const stamp = Date.now();
  const adminEmail = `admin.imp12.${stamp}@example.com`;
  const password = 'secret12';
  let adminId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    const admin = await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone)
       VALUES ($1,$2,'admin','Admin','Imp12','')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [adminEmail, hash],
    );
    adminId = admin.rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('POST /functions/create-user and /functions/v1 alias create via users service', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const email = `created.edge.${stamp}@example.com`;
      const res = await fetch(`${base}/functions/create-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: 'secret12',
          nom: 'Edge',
          prenom: 'User',
          phone: '+33111111111',
          role: 'ouvrier',
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.user.email, email);
      assert.equal(body.user.role, 'ouvrier');
      assert.ok(body.user.id);

      const aliasEmail = `created.v1.${stamp}@example.com`;
      const alias = await fetch(`${base}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: aliasEmail,
          password: 'secret12',
          nom: 'V1',
          prenom: 'User',
          role: 'chef_equipe',
        }),
      });
      assert.equal(alias.status, 201);
      const aliasBody = await alias.json();
      assert.equal(aliasBody.success, true);
      assert.equal(aliasBody.user.email, aliasEmail);
    } finally {
      await close();
    }
  });

  it('POST /functions/delete-user removes user; self-delete blocked by Imp-03', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const create = await fetch(`${base}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: `todelete.${stamp}@example.com`,
          password: 'secret12',
          nom: 'Del',
          prenom: 'Me',
          role: 'ouvrier',
        }),
      });
      const created = await create.json();
      const del = await fetch(`${base}/functions/delete-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: created.user.id }),
      });
      assert.equal(del.status, 200);
      const delBody = await del.json();
      assert.equal(delBody.success, true);

      const self = await fetch(`${base}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: adminId }),
      });
      assert.equal(self.status, 400);
      const selfBody = await self.json();
      assert.equal(typeof selfBody.error, 'string');
    } finally {
      await close();
    }
  });

  it('POST /rpc/delete_chantier_cascade and /rest/v1/rpc alias', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const create = await fetch(`${base}/api/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: `Compat Site ${stamp}`, adresse: '1 rue' }),
      });
      assert.equal(create.status, 201);
      const { chantier } = await create.json();

      const rpc = await fetch(`${base}/rpc/delete_chantier_cascade`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ p_chantier_id: chantier.id }),
      });
      assert.equal(rpc.status, 200);

      const gone = await fetch(`${base}/api/chantiers/${chantier.id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(gone.status, 404);

      const create2 = await fetch(`${base}/api/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: `Compat Site2 ${stamp}` }),
      });
      const { chantier: c2 } = await create2.json();
      const restRpc = await fetch(`${base}/rest/v1/rpc/delete_chantier_cascade`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ p_chantier_id: c2.id }),
      });
      assert.equal(restRpc.status, 200);
    } finally {
      await close();
    }
  });

  it('GET/PATCH /tables/profiles uses Imp-03/11 services (role lock still enforced)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const list = await fetch(`${base}/tables/profiles`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(list.status, 200);
      const rows = await list.json();
      assert.ok(Array.isArray(rows));
      assert.ok(rows.some((r) => r.email === adminEmail));

      const create = await fetch(`${base}/functions/create-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: `patchable.${stamp}@example.com`,
          password: 'secret12',
          nom: 'Before',
          prenom: 'Name',
          phone: '',
          role: 'ouvrier',
        }),
      });
      const { user } = await create.json();

      const patch = await fetch(`${base}/tables/profiles/${user.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: 'After',
          prenom: 'Name',
          phone: '+33222222222',
          role: 'chef_equipe',
        }),
      });
      assert.equal(patch.status, 200);
      const patched = await patch.json();
      assert.equal(patched.nom, 'After');
      assert.equal(patched.phone, '+33222222222');
      assert.equal(patched.role, 'chef_equipe');

      const lock = await fetch(`${base}/tables/profiles/${adminId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(lock.status, 400);
      const lockBody = await lock.json();
      assert.equal(typeof lockBody.error, 'string');
    } finally {
      await close();
    }
  });
});
