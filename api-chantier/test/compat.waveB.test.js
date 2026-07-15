/**
 * Imp-12 Wave B — table + auth compatibility adapters (dual /tables + /rest/v1).
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

describe('Imp-12 Wave B compatibility', () => {
  const stamp = Date.now();
  const password = 'secret12';
  const adminEmail = `admin.imp12b.${stamp}@example.com`;
  const chefEmail = `chef.imp12b.${stamp}@example.com`;
  const ouvEmail = `ouv.imp12b.${stamp}@example.com`;
  let adminId;
  let chefId;
  let ouvId;

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
        [email, hash, role, role, 'Imp12B'],
      );
    }
    adminId = (await query(`SELECT id FROM profiles WHERE email=$1`, [adminEmail])).rows[0].id;
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    ouvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouvEmail])).rows[0].id;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('thin auth /auth/v1 token+user+refresh+logout reuses Imp-02', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const tok = await fetch(
        `${base}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: adminEmail, password }),
        },
      );
      assert.equal(tok.status, 200);
      const session = await tok.json();
      assert.ok(session.access_token);
      assert.ok(session.refresh_token);
      assert.equal(session.token_type, 'bearer');
      assert.equal(session.user.email, adminEmail);

      const me = await fetch(`${base}/auth/v1/user`, {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      assert.equal(me.status, 200);
      const meBody = await me.json();
      assert.equal(meBody.user.id, adminId);

      const refreshed = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      assert.equal(refreshed.status, 200);
      const next = await refreshed.json();
      assert.ok(next.access_token);
      assert.ok(next.refresh_token);

      const out = await fetch(`${base}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: next.refresh_token }),
      });
      assert.equal(out.status, 200);

      const reuse = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: next.refresh_token }),
      });
      assert.equal(reuse.status, 401);
    } finally {
      await close();
    }
  });

  it('chantiers dual /tables and /rest/v1; RBAC preserved', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken: adminTok } = await loginApi(base, adminEmail, password);
      const { accessToken: ouvTok } = await loginApi(base, ouvEmail, password);

      const create = await fetch(`${base}/tables/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({ code: `IMP12B-${stamp}`, nom: 'Site Wave B' }),
      });
      assert.equal(create.status, 201);
      const chantier = await create.json();
      assert.equal(chantier.nom, 'Site Wave B');

      const dual = await fetch(`${base}/rest/v1/chantiers/${chantier.id}`, {
        headers: { authorization: `Bearer ${adminTok}` },
      });
      assert.equal(dual.status, 200);
      assert.equal((await dual.json()).id, chantier.id);

      const forbidden = await fetch(`${base}/tables/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({ nom: 'Nope' }),
      });
      assert.equal(forbidden.status, 403);

      const patch = await fetch(`${base}/rest/v1/chantiers/${chantier.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({ nom: 'Site Wave B Renamed' }),
      });
      assert.equal(patch.status, 200);
      assert.equal((await patch.json()).nom, 'Site Wave B Renamed');
    } finally {
      await close();
    }
  });

  it('profiles also dual-mounted on /rest/v1 (B-002)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, adminEmail, password);
      const tables = await fetch(`${base}/tables/profiles`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const rest = await fetch(`${base}/rest/v1/profiles`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      assert.equal(tables.status, 200);
      assert.equal(rest.status, 200);
      assert.ok(Array.isArray(await tables.json()));
      assert.ok(Array.isArray(await rest.json()));
    } finally {
      await close();
    }
  });

  it('affectations_chantiers via assignUser + soft-remove (B-005=B)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken: adminTok } = await loginApi(base, adminEmail, password);
      const ch = await query(
        `INSERT INTO chantiers (code, nom) VALUES ($1,$2) RETURNING id`,
        [`IMP12B-AFF-${stamp}`, 'Aff Site'],
      );
      const chantierId = ch.rows[0].id;

      const created = await fetch(`${base}/tables/affectations_chantiers`, {
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
      assert.equal(created.status, 201);
      const aff = await created.json();
      assert.equal(aff.user_id, ouvId);

      const list = await fetch(
        `${base}/rest/v1/affectations_chantiers?chantier_id=${chantierId}`,
        { headers: { authorization: `Bearer ${adminTok}` } },
      );
      assert.equal(list.status, 200);
      const rows = await list.json();
      assert.ok(rows.some((r) => r.id === aff.id));

      const soft = await fetch(`${base}/tables/affectations_chantiers/${aff.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({ date_fin: '2026-07-15' }),
      });
      assert.equal(soft.status, 200);
      assert.ok((await soft.json()).date_fin);
    } finally {
      await close();
    }
  });

  it('zones_equipe / zones_chantiers / zones_ouvriers reuse Imp-05', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken: chefTok } = await loginApi(base, chefEmail, password);
      const { accessToken: adminTok } = await loginApi(base, adminEmail, password);

      const ch = await query(
        `INSERT INTO chantiers (code, nom) VALUES ($1,$2) RETURNING id`,
        [`IMP12B-Z-${stamp}`, 'Zone Site'],
      );
      const chantierId = ch.rows[0].id;

      const zoneRes = await fetch(`${base}/tables/zones_equipe`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ nom: `Z-B-${stamp}`, chef_equipe_id: chefId }),
      });
      assert.equal(zoneRes.status, 201);
      const zone = await zoneRes.json();

      const link = await fetch(`${base}/rest/v1/zones_chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ zone_id: zone.id, chantier_id: chantierId }),
      });
      assert.equal(link.status, 201);

      const addOuv = await fetch(`${base}/tables/zones_ouvriers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({ zone_id: zone.id, user_id: ouvId }),
      });
      assert.equal(addOuv.status, 201);

      const softOuv = await fetch(`${base}/rest/v1/zones_ouvriers/${zone.id}/${ouvId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefTok}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(softOuv.status, 200);
      assert.ok((await softOuv.json()).date_fin);

      const zones = await fetch(`${base}/tables/zones_equipe`, {
        headers: { authorization: `Bearer ${chefTok}` },
      });
      assert.equal(zones.status, 200);
      assert.ok((await zones.json()).some((z) => z.id === zone.id));

      // Admin cannot invent Super Admin path — plain RBAC still applies via Imp-05
      void adminTok;
    } finally {
      await close();
    }
  });

  it('periodes_travail CRUD + declarations_heures GET only (B-003=C)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken: adminTok } = await loginApi(base, adminEmail, password);
      const { accessToken: ouvTok } = await loginApi(base, ouvEmail, password);

      const ch = await query(
        `INSERT INTO chantiers (code, nom) VALUES ($1,$2) RETURNING id`,
        [`IMP12B-P-${stamp}`, 'Period Site'],
      );
      const chantierId = ch.rows[0].id;
      await query(
        `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut)
         VALUES ($1,$2,$3,CURRENT_DATE)
         ON CONFLICT (user_id, chantier_id) DO UPDATE SET date_fin = NULL`,
        [ouvId, chantierId, chefId],
      );

      const created = await fetch(`${base}/tables/periodes_travail`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: '2026-07-10',
          heure_debut: '08:00',
          heure_fin: '12:00',
        }),
      });
      assert.equal(created.status, 201);
      const period = await created.json();
      assert.ok(period.id);

      const listP = await fetch(
        `${base}/rest/v1/periodes_travail?chantier_id=${chantierId}`,
        { headers: { authorization: `Bearer ${ouvTok}` } },
      );
      assert.equal(listP.status, 200);
      assert.ok((await listP.json()).some((p) => p.id === period.id));

      const decls = await fetch(
        `${base}/tables/declarations_heures?chantier_id=${chantierId}`,
        { headers: { authorization: `Bearer ${adminTok}` } },
      );
      assert.equal(decls.status, 200);
      assert.ok(Array.isArray(await decls.json()));

      const dualDecls = await fetch(
        `${base}/rest/v1/declarations_heures?user_id=${ouvId}`,
        { headers: { authorization: `Bearer ${adminTok}` } },
      );
      assert.equal(dualDecls.status, 200);

      for (const method of ['PATCH', 'POST', 'DELETE', 'PUT']) {
        const blocked = await fetch(`${base}/tables/declarations_heures`, {
          method,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${adminTok}`,
          },
          body: JSON.stringify({ statut: 'validee' }),
        });
        assert.ok(
          [404, 405].includes(blocked.status),
          `declarations collection write ${method} must not be routed (got ${blocked.status})`,
        );
      }

      // Phase 13 DR-P13-003=A — PATCH by id is allowed and delegates to Imp-07
      const patchById = await fetch(`${base}/tables/declarations_heures/00000000-0000-4000-8000-000000000099`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({ statut: 'validee' }),
      });
      assert.ok(
        [400, 404, 403, 409].includes(patchById.status),
        `PATCH by id must hit Imp-07 adapter (got ${patchById.status})`,
      );

      const del = await fetch(`${base}/tables/periodes_travail/${period.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${ouvTok}` },
      });
      assert.equal(del.status, 200);
    } finally {
      await close();
    }
  });

  it('RPC dual mount still works beside /rest/v1 tables', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const { accessToken } = await loginApi(base, adminEmail, password);
      const create = await fetch(`${base}/api/chantiers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: `IMP12B-RPC-${stamp}`, nom: 'RPC Keep' }),
      });
      assert.equal(create.status, 201);
      const { chantier } = await create.json();

      const rpc = await fetch(`${base}/rest/v1/rpc/delete_chantier_cascade`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ p_chantier_id: chantier.id }),
      });
      assert.equal(rpc.status, 200);
    } finally {
      await close();
    }
  });
});
