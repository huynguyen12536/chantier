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

describe('Imp-06 CVL parity P1–P6', () => {
  const ts = Date.now();
  const password = 'secret12';
  const ouvEmail = `ouv.p06.${ts}@example.com`;
  const ouv2Email = `ouv2.p06.${ts}@example.com`;
  const chefEmail = `chef.p06.${ts}@example.com`;
  const chefOutEmail = `chefout.p06.${ts}@example.com`;
  let ouvId;
  let ouv2Id;
  let chefId;
  let chantierA;
  let chantierB;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    for (const [email, role] of [
      [ouvEmail, 'ouvrier'],
      [ouv2Email, 'ouvrier'],
      [chefEmail, 'chef_equipe'],
      [chefOutEmail, 'chef_equipe'],
    ]) {
      await query(
        `INSERT INTO profiles (email, password_hash, role)
         VALUES ($1,$2,$3)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
        [email, hash, role],
      );
    }
    ouvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouvEmail])).rows[0].id;
    ouv2Id = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouv2Email])).rows[0].id;
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    const outChef = (
      await query(`SELECT id FROM profiles WHERE email=$1`, [chefOutEmail])
    ).rows[0].id;

    chantierA = (
      await query(
        `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_apres_midi)
         VALUES ($1,'Parity A','08:00','17:00')
         ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom RETURNING id`,
        [`P06A-${ts}`],
      )
    ).rows[0].id;
    chantierB = (
      await query(
        `INSERT INTO chantiers (code, nom)
         VALUES ($1,'Parity B')
         ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom RETURNING id`,
        [`P06B-${ts}`],
      )
    ).rows[0].id;

    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id)
       VALUES ($1,$2,$3), ($4,$2,$3)
       ON CONFLICT (user_id, chantier_id) DO UPDATE SET chef_equipe_id = EXCLUDED.chef_equipe_id`,
      [ouvId, chantierA, chefId, chefId],
    );
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2) ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [outChef, chantierB],
    );
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

  it('P1: worker without assignment rejected', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      await query(`DELETE FROM zones_ouvriers WHERE user_id = $1`, [ouv2Id]);
      await query(
        `DELETE FROM affectations_chantiers WHERE user_id = $1 AND chantier_id = $2`,
        [ouv2Id, chantierA],
      );
      const token = await login(base, ouv2Email);
      const res = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-01',
          heure_debut: '08:00',
          heure_fin: '12:00',
        }),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error?.code, 'FORBIDDEN_CHANTIER');
    } finally {
      await close();
    }
  });

  it('P1: worker via zone membership allowed', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const zone = await query(
        `INSERT INTO zones_equipe (nom, chef_equipe_id) VALUES ('Z1',$1) RETURNING id`,
        [chefId],
      );
      const zid = zone.rows[0].id;
      await query(`INSERT INTO zones_chantiers (zone_id, chantier_id) VALUES ($1,$2)`, [
        zid,
        chantierA,
      ]);
      await query(`INSERT INTO zones_ouvriers (zone_id, user_id) VALUES ($1,$2)`, [
        zid,
        ouv2Id,
      ]);

      const token = await login(base, ouv2Email);
      const res = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-02',
          heure_debut: '08:00',
          heure_fin: '10:00',
          panier_repas: true,
          latitude_debut: 48.85,
          longitude_debut: 2.35,
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.period.panier_repas, true);
      assert.equal(body.period.latitude_debut, 48.85);
    } finally {
      await close();
    }
  });

  it('P2/P5: chef outside scope 403; inside scope lists only supervised', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const ouvTok = await login(base, ouvEmail);
      const created = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-03',
          heure_debut: '07:00',
          heure_fin: '09:00',
        }),
      });
      assert.equal(created.status, 201);
      const { declaration } = await created.json();

      const outTok = await login(base, chefOutEmail);
      const deny = await fetch(
        `${base}/api/validation/declarations/${declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${outTok}` } },
      );
      assert.equal(deny.status, 403);

      const listOut = await fetch(`${base}/api/timesheet/periods`, {
        headers: { authorization: `Bearer ${outTok}` },
      });
      const outPeriods = (await listOut.json()).periods;
      assert.ok(!outPeriods.some((p) => p.chantier_id === chantierA));

      const chefTok = await login(base, chefEmail);
      const listIn = await fetch(`${base}/api/timesheet/periods`, {
        headers: { authorization: `Bearer ${chefTok}` },
      });
      const inPeriods = (await listIn.json()).periods;
      assert.ok(inPeriods.some((p) => p.chantier_id === chantierA));
    } finally {
      await close();
    }
  });

  it('P4: declaration hour CHECK rejects out-of-range', async () => {
    await assert.rejects(
      () =>
        query(
          `INSERT INTO declarations_heures
             (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, statut)
           VALUES ($1,$2,'2099-01-01', 25, 0, 0, 'soumise')`,
          [ouvId, chantierA],
        ),
      /heures_normales|check/i,
    );
  });

  it('P6: auto-approve hit when matching latest validated shift', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const ouvTok = await login(base, ouvEmail);
      const chefTok = await login(base, chefEmail);
      const seed = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-04',
          heure_debut: '14:00',
          heure_fin: '16:00',
          panier_repas: false,
          deplacement: false,
        }),
      });
      const seeded = await seed.json();
      const approve = await fetch(
        `${base}/api/validation/declarations/${seeded.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${chefTok}` } },
      );
      assert.equal(approve.status, 200);

      const hit = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-05',
          heure_debut: '14:00',
          heure_fin: '16:00',
          panier_repas: false,
          deplacement: false,
        }),
      });
      assert.equal(hit.status, 201);
      const hitBody = await hit.json();
      assert.equal(hitBody.declaration.statut, 'validee');
      assert.ok(hitBody.declaration.validated_by);
    } finally {
      await close();
    }
  });

  it('P6: auto-approve miss when shift differs', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const ouvTok = await login(base, ouvEmail);
      const miss = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvTok}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-06',
          heure_debut: '10:00',
          heure_fin: '11:00',
          panier_repas: true,
        }),
      });
      assert.equal(miss.status, 201);
      assert.equal((await miss.json()).declaration.statut, 'soumise');
    } finally {
      await close();
    }
  });

  it('P6 Soft Annulee lifecycle keeps row', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const create = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierA,
          date: '2026-08-07',
          heure_debut: '08:30',
          heure_fin: '09:30',
        }),
      });
      const created = await create.json();
      assert.equal(created.declaration.statut, 'soumise');
      const del = await fetch(`${base}/api/timesheet/periods/${created.period.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(del.status, 200);
      assert.equal((await del.json()).declaration.statut, 'annulee');
      const rows = await query(
        `SELECT statut FROM declarations_heures WHERE id=$1`,
        [created.declaration.id],
      );
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0].statut, 'annulee');
    } finally {
      await close();
    }
  });
});
