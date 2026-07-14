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

describe('Imp-02 Authentication', () => {
  const email = `ouvrier.imp02.${Date.now()}@example.com`;
  const password = 'secret12';

  before(async () => {
    await runMigrations();
    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom)
       VALUES ($1, $2, 'ouvrier', 'Test', 'User')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, actif = TRUE`,
      [email, passwordHash],
    );
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('login returns access and refresh tokens', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.accessToken);
      assert.ok(body.refreshToken);
      assert.equal(body.user.role, 'ouvrier');
      assert.equal(body.user.email, email);
    } finally {
      await close();
    }
  });

  it('rejects wrong password', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'wrong-password' }),
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    } finally {
      await close();
    }
  });

  it('me requires auth and returns profile', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const loginRes = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const { accessToken } = await loginRes.json();
      const meRes = await fetch(`${base}/api/auth/me`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      assert.equal(meRes.status, 200);
      const me = await meRes.json();
      assert.equal(me.user.email, email);

      const unauth = await fetch(`${base}/api/auth/me`);
      assert.equal(unauth.status, 401);
    } finally {
      await close();
    }
  });

  it('refresh rotates tokens', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const loginRes = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = await loginRes.json();
      const refreshRes = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
      });
      assert.equal(refreshRes.status, 200);
      const refreshed = await refreshRes.json();
      assert.ok(refreshed.accessToken);
      assert.notEqual(refreshed.refreshToken, loginBody.refreshToken);
    } finally {
      await close();
    }
  });
});
