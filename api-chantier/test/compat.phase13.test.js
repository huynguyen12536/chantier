/**
 * Phase 13 — FE cutover + compat growth tests (DR-P13-001…009).
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

async function loginApi(base, email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200);
  return res.json();
}

describe('Phase 13 compatibility', () => {
  const stamp = Date.now();
  const password = 'secret13';
  const adminEmail = `admin.imp13.${stamp}@example.com`;
  const chefEmail = `chef.imp13.${stamp}@example.com`;
  const ouvEmail = `ouv.imp13.${stamp}@example.com`;
  let adminId;
  let chefId;
  let ouvId;
  let chantierId;
  let declId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    for (const [email, role] of [
      [adminEmail, 'admin'],
      [chefEmail, 'chef_equipe'],
      [ouvEmail, 'ouvrier'],
    ]) {
      await query(
        `INSERT INTO profiles (email, password_hash, role, nom, prenom, phone)
         VALUES ($1,$2,$3,$4,$5,'')
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
         RETURNING id`,
        [email, hash, role, role, 'Imp13'],
      );
    }
    adminId = (await query(`SELECT id FROM profiles WHERE email=$1`, [adminEmail])).rows[0].id;
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    ouvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouvEmail])).rows[0].id;

    const ch = await query(
      `INSERT INTO chantiers (code, nom, adresse, heure_debut_matin, heure_fin_matin, actif)
       VALUES ($1,$2,'addr','07:30','12:00', TRUE) RETURNING id`,
      [`C13${stamp % 100000}`, 'Phase13 Chantier'],
    );
    chantierId = ch.rows[0].id;

    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id)
       VALUES ($1,$2,$1), ($3,$2,$1)
       ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [chefId, chantierId, ouvId],
    );

    const day = '2026-07-01';
    await query(
      `INSERT INTO periodes_travail
         (user_id, chantier_id, date, heure_debut, heure_fin, statut, panier, deplacement)
       VALUES ($1,$2,$3,'08:00','12:00','terminee', false, false)`,
      [ouvId, chantierId, day],
    );
    const d = await query(
      `INSERT INTO declarations_heures
         (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut)
       VALUES ($1,$2,$3,4,0,0,'soumise') RETURNING id`,
      [ouvId, chantierId, day],
    );
    declId = d.rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('maps heure_debut/fin on chantier create (DR-P13-008)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, adminEmail, password);
      const res = await fetch(`${base}/rest/v1/chantiers`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          nom: 'Hours Mapped',
          code: `H13${String(stamp).slice(-6)}`,
          heure_debut: '07:15',
          heure_fin: '16:30',
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(String(body.heure_debut).startsWith('07:15'));
      assert.ok(String(body.heure_fin).startsWith('16:30'));
      assert.ok(String(body.heure_debut_matin).startsWith('07:15'));
    } finally {
      await close();
    }
  });

  it('declarations PATCH approve delegates to Imp-07 (DR-P13-003)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, chefEmail, password);
      const res = await fetch(`${base}/rest/v1/declarations_heures/${declId}`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ statut: 'validee' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.statut, 'validee');
    } finally {
      await close();
    }
  });

  it('zones_ouvriers GET composer tree for ouvrier (DR-P13-005)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, adminEmail, password);
      const zoneRes = await fetch(`${base}/rest/v1/zones_equipe`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          nom: 'Z13',
          chef_equipe_id: chefId,
        }),
      });
      assert.equal(zoneRes.status, 201);
      const zone = await zoneRes.json();

      await fetch(`${base}/rest/v1/zones_chantiers`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ zone_id: zone.id, chantier_id: chantierId }),
      });
      await fetch(`${base}/rest/v1/zones_ouvriers`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ zone_id: zone.id, user_id: ouvId }),
      });

      const { accessToken: ouvTok } = await loginApi(base, ouvEmail, password);
      const list = await fetch(
        `${base}/rest/v1/zones_ouvriers?user_id=${ouvId}&date_fin_is=null&compose=tree`,
        { headers: { authorization: `Bearer ${ouvTok}` } },
      );
      assert.equal(list.status, 200);
      const rows = await list.json();
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length >= 1);
      assert.ok(rows[0].zones_chantiers);
    } finally {
      await close();
    }
  });

  it('affectations POST assign (no upsert invent) (DR-P13-009)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, adminEmail, password);
      const res = await fetch(`${base}/rest/v1/affectations_chantiers`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          user_id: ouvId,
          chantier_id: chantierId,
          chef_equipe_id: chefId,
        }),
      });
      assert.equal(res.status, 201);
    } finally {
      await close();
    }
  });

  it('profile self GET allowed for ouvrier (WP2)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, ouvEmail, password);
      const res = await fetch(`${base}/rest/v1/profiles/${ouvId}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.id, ouvId);
    } finally {
      await close();
    }
  });
});
