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

describe('Imp-05 Assignments & Zones', () => {
  const adminEmail = `admin.imp05.${Date.now()}@example.com`;
  const ouvEmail = `ouv.imp05.${Date.now()}@example.com`;
  const password = 'secret12';
  let adminId;
  let ouvId;
  let chantierId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    const adm = await query(
      `INSERT INTO profiles (email, password_hash, role) VALUES ($1,$2,'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [adminEmail, hash],
    );
    adminId = adm.rows[0].id;
    const ouv = await query(
      `INSERT INTO profiles (email, password_hash, role) VALUES ($1,$2,'ouvrier')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [ouvEmail, hash],
    );
    ouvId = ouv.rows[0].id;
    const ch = await query(
      `INSERT INTO chantiers (code, nom) VALUES ($1,'Site Imp05')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom RETURNING id`,
      [`IMP05-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('assigns unique user/chantier and creates zone', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const login = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      const { accessToken } = await login.json();
      const ass = await fetch(`${base}/api/affectations`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: ouvId, chantier_id: chantierId }),
      });
      assert.equal(ass.status, 201);

      const zone = await fetch(`${base}/api/zones`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nom: 'Zone 1', chef_equipe_id: adminId }),
      });
      assert.equal(zone.status, 201);
      const { zone: z } = await zone.json();
      const link = await fetch(`${base}/api/zones/${z.id}/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ chantier_id: chantierId }),
      });
      assert.equal(link.status, 201);
    } finally {
      await close();
    }
  });
});
