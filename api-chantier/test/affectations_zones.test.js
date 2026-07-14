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

describe('Imp-05 Parity — Assignments & Zones', () => {
  const ts = Date.now();
  const adminEmail = `admin.imp05p.${ts}@example.com`;
  const admInEmail = `administ.imp05p.${ts}@example.com`;
  const chefEmail = `chef.imp05p.${ts}@example.com`;
  const chef2Email = `chef2.imp05p.${ts}@example.com`;
  const ouvEmail = `ouv.imp05p.${ts}@example.com`;
  const password = 'secret12';
  let adminId;
  let chefId;
  let chef2Id;
  let ouvId;
  let chantierId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    for (const [email, role] of [
      [adminEmail, 'admin'],
      [admInEmail, 'administratif'],
      [chefEmail, 'chef_equipe'],
      [chef2Email, 'chef_equipe'],
      [ouvEmail, 'ouvrier'],
    ]) {
      await query(
        `INSERT INTO profiles (email, password_hash, role)
         VALUES ($1,$2,$3)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
        [email, hash, role],
      );
    }
    adminId = (await query(`SELECT id FROM profiles WHERE email=$1`, [adminEmail])).rows[0].id;
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    chef2Id = (await query(`SELECT id FROM profiles WHERE email=$1`, [chef2Email])).rows[0].id;
    ouvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouvEmail])).rows[0].id;
    const ch = await query(
      `INSERT INTO chantiers (code, nom) VALUES ($1,'Site Imp05P')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom RETURNING id`,
      [`IMP05P-${ts}`],
    );
    chantierId = ch.rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  async function login(base, email) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(res.status, 200);
    return (await res.json()).accessToken;
  }

  it('unique assign + soft remove; chef can write affectation', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const adminTok = await login(base, adminEmail);
      const ass = await fetch(`${base}/api/affectations`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({
          user_id: ouvId,
          chantier_id: chantierId,
          chef_equipe_id: chefId,
        }),
      });
      assert.equal(ass.status, 201);
      const { affectation } = await ass.json();

      const chefTok = await login(base, chefEmail);
      const chefAss = await fetch(`${base}/api/affectations`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({
          user_id: chefId,
          chantier_id: chantierId,
          chef_equipe_id: chefId,
        }),
      });
      assert.equal(chefAss.status, 201);

      const soft = await fetch(`${base}/api/affectations/${affectation.id}/soft-remove`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminTok}` },
      });
      assert.equal(soft.status, 200);
      assert.ok((await soft.json()).affectation.date_fin);
    } finally {
      await close();
    }
  });

  it('scope: ouvrier sees only own affectations', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const ouvTok = await login(base, ouvEmail);
      const res = await fetch(`${base}/api/affectations`, {
        headers: { authorization: `Bearer ${ouvTok}` },
      });
      assert.equal(res.status, 200);
      const { affectations } = await res.json();
      assert.ok(affectations.every((a) => a.user_id === ouvId));
    } finally {
      await close();
    }
  });

  it('RBAC zones: administratif cannot create zone', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const tok = await login(base, admInEmail);
      const res = await fetch(`${base}/api/zones`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({ nom: 'Nope', chef_equipe_id: chefId }),
      });
      assert.equal(res.status, 403);
    } finally {
      await close();
    }
  });

  it('ownership: chef CRUD own zone; forbidden on other chef zone', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const chefTok = await login(base, chefEmail);
      const create = await fetch(`${base}/api/zones`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({
          nom: 'Zone Chef1',
          description: 'parity',
          chef_equipe_id: chefId,
        }),
      });
      assert.equal(create.status, 201);
      const { zone } = await create.json();
      assert.equal(zone.description, 'parity');

      const forge = await fetch(`${base}/api/zones`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ nom: 'Steal', chef_equipe_id: chef2Id }),
      });
      assert.equal(forge.status, 403);

      const chef2Tok = await login(base, chef2Email);
      const stealLink = await fetch(`${base}/api/zones/${zone.id}/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chef2Tok}`,
        },
        body: JSON.stringify({ chantier_id: chantierId }),
      });
      assert.equal(stealLink.status, 403);

      const link = await fetch(`${base}/api/zones/${zone.id}/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ chantier_id: chantierId }),
      });
      assert.equal(link.status, 201);

      const add = await fetch(`${base}/api/zones/${zone.id}/ouvriers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ user_id: ouvId }),
      });
      assert.equal(add.status, 201);

      const dup = await fetch(`${base}/api/zones/${zone.id}/ouvriers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ user_id: ouvId }),
      });
      assert.equal(dup.status, 409);

      const soft = await fetch(
        `${base}/api/zones/${zone.id}/ouvriers/${ouvId}/soft-remove`,
        { method: 'PATCH', headers: { authorization: `Bearer ${chefTok}` } },
      );
      assert.equal(soft.status, 200);
      assert.ok((await soft.json()).member.date_fin);

      const restore = await fetch(`${base}/api/zones/${zone.id}/ouvriers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ user_id: ouvId }),
      });
      assert.equal(restore.status, 201);
      assert.equal((await restore.json()).member.date_fin, null);

      const unlinkCh = await fetch(
        `${base}/api/zones/${zone.id}/chantiers/${chantierId}`,
        { method: 'DELETE', headers: { authorization: `Bearer ${chefTok}` } },
      );
      assert.equal(unlinkCh.status, 200);

      const listChef = await fetch(`${base}/api/zones`, {
        headers: { authorization: `Bearer ${chefTok}` },
      });
      const zonesChef = (await listChef.json()).zones;
      assert.ok(zonesChef.every((z) => z.chef_equipe_id === chefId));

      const ouvTok = await login(base, ouvEmail);
      const listOuv = await fetch(`${base}/api/zones`, {
        headers: { authorization: `Bearer ${ouvTok}` },
      });
      const zonesOuv = (await listOuv.json()).zones;
      assert.ok(zonesOuv.some((z) => z.id === zone.id));
    } finally {
      await close();
    }
  });

  it('date validation rejects date_fin < date_debut', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const tok = await login(base, adminEmail);
      const res = await fetch(`${base}/api/affectations`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({
          user_id: chef2Id,
          chantier_id: chantierId,
          date_debut: '2026-07-10',
          date_fin: '2026-07-01',
        }),
      });
      assert.equal(res.status, 400);
    } finally {
      await close();
    }
  });

  it('ouvrier cannot write affectation or zone', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const tok = await login(base, ouvEmail);
      const a = await fetch(`${base}/api/affectations`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({ user_id: ouvId, chantier_id: chantierId }),
      });
      assert.equal(a.status, 403);
      const z = await fetch(`${base}/api/zones`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({ nom: 'X', chef_equipe_id: ouvId }),
      });
      assert.equal(z.status, 403);
    } finally {
      await close();
    }
  });
});
