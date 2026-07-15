/**
 * Imp-11 Administration — PATCH / role lifecycle / demotion guards.
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

describe('Imp-11 Administration users', () => {
  const stamp = Date.now();
  const adminEmail = `admin.imp11.${stamp}@example.com`;
  const chefEmail = `chef.imp11.${stamp}@example.com`;
  const ouvEmail = `ouv.imp11.${stamp}@example.com`;
  const password = 'secret12';
  let adminId;
  let chefId;
  let chantierId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    const admin = await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone)
       VALUES ($1,$2,'admin','Admin','Imp11','')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [adminEmail, hash],
    );
    adminId = admin.rows[0].id;
    const chef = await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone)
       VALUES ($1,$2,'chef_equipe','Chef','Imp11','')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'chef_equipe'
       RETURNING id`,
      [chefEmail, hash],
    );
    chefId = chef.rows[0].id;
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone)
       VALUES ($1,$2,'ouvrier','Ouv','Imp11','')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [ouvEmail, hash],
    );
    const ch = await query(
      `INSERT INTO chantiers (code, nom)
       VALUES ($1,'Imp11 Site')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP11-${stamp}`],
    );
    chantierId = ch.rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('PATCH updates nom prenom phone email and updated_at', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const before = await query(`SELECT updated_at FROM profiles WHERE id = $1`, [chefId]);
      const res = await fetch(`${base}/api/users/${chefId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: 'ChefNom',
          prenom: 'ChefPrenom',
          phone: '+33123456789',
          email: `chef.patched.${stamp}@example.com`,
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.user.nom, 'ChefNom');
      assert.equal(body.user.prenom, 'ChefPrenom');
      assert.equal(body.user.phone, '+33123456789');
      assert.equal(body.user.email, `chef.patched.${stamp}@example.com`);
      const after = await query(`SELECT updated_at FROM profiles WHERE id = $1`, [chefId]);
      assert.ok(new Date(after.rows[0].updated_at) >= new Date(before.rows[0].updated_at));
    } finally {
      await close();
    }
  });

  it('promote ouvrier to chef_equipe', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, adminEmail, password);
      const ouv = await query(`SELECT id FROM profiles WHERE email = $1`, [ouvEmail]);
      const res = await fetch(`${base}/api/users/${ouv.rows[0].id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'chef_equipe' }),
      });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).user.role, 'chef_equipe');
      // restore ouvrier for later tests
      await query(`UPDATE profiles SET role = 'ouvrier' WHERE id = $1`, [ouv.rows[0].id]);
    } finally {
      await close();
    }
  });

  it('demotion blocked when active chef on affectation', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      await query(
        `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id, chantier_id) DO UPDATE
           SET chef_equipe_id = EXCLUDED.chef_equipe_id, date_fin = NULL`,
        [chefId, chantierId, chefId],
      );
      const token = await login(base, adminEmail, password);
      const res = await fetch(`${base}/api/users/${chefId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(res.status, 409);
      assert.equal((await res.json()).error.code, 'DEMOTION_AFFECTATION_CHEF');
      await query(
        `UPDATE affectations_chantiers SET chef_equipe_id = NULL WHERE user_id = $1 AND chantier_id = $2`,
        [chefId, chantierId],
      );
    } finally {
      await close();
    }
  });

  it('demotion blocked when owns zone', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const z = await query(
        `INSERT INTO zones_equipe (nom, chef_equipe_id) VALUES ('Z Imp11',$1) RETURNING id`,
        [chefId],
      );
      const token = await login(base, adminEmail, password);
      const res = await fetch(`${base}/api/users/${chefId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(res.status, 409);
      assert.equal((await res.json()).error.code, 'DEMOTION_ZONE_OWNER');
      await query(`DELETE FROM zones_equipe WHERE id = $1`, [z.rows[0].id]);
    } finally {
      await close();
    }
  });

  it('cannot change role of another admin; cannot change own role', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const hash = await hashPassword(password);
      const otherAdmin = await query(
        `INSERT INTO profiles (email, password_hash, role, nom, prenom)
         VALUES ($1,$2,'admin','A2','Imp11') RETURNING id`,
        [`admin2.imp11.${stamp}@example.com`, hash],
      );
      const token = await login(base, adminEmail, password);
      const lock = await fetch(`${base}/api/users/${otherAdmin.rows[0].id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(lock.status, 400);
      assert.equal((await lock.json()).error.code, 'ROLE_LOCK');

      const self = await fetch(`${base}/api/users/${adminId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(self.status, 400);
      assert.equal((await self.json()).error.code, 'ROLE_LOCK');
    } finally {
      await close();
    }
  });

  it('demotion succeeds when no chef ownership', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      await query(
        `UPDATE affectations_chantiers SET chef_equipe_id = NULL
         WHERE chef_equipe_id = $1`,
        [chefId],
      );
      await query(`DELETE FROM zones_equipe WHERE chef_equipe_id = $1`, [chefId]);
      await query(`UPDATE profiles SET role = 'chef_equipe' WHERE id = $1`, [chefId]);
      const token = await login(base, adminEmail, password);
      const res = await fetch(`${base}/api/users/${chefId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ouvrier' }),
      });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).user.role, 'ouvrier');
      await query(`UPDATE profiles SET role = 'chef_equipe' WHERE id = $1`, [chefId]);
    } finally {
      await close();
    }
  });
});
