import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import { splitHours } from '../src/modules/timesheet/domain/calculation.js';
import { durationHours } from '../src/modules/timesheet/domain/timeUtility.js';

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

describe('Imp-06 Timesheet domain units', () => {
  it('durationHours and CADRE split with 7h fallback', () => {
    assert.equal(durationHours('08:00', '12:00'), 4);
    const fallback = splitHours('08:00', '17:00', null, null);
    assert.equal(fallback.heures_normales, 7);
    assert.equal(fallback.heures_supplementaires, 2);
    const cadre = splitHours('08:00', '18:00', '08:00', '17:00');
    assert.equal(cadre.heures_normales, 9);
    assert.equal(cadre.heures_supplementaires, 1);
  });
});

describe('Imp-06 Timesheet API', () => {
  const ouvEmail = `ouv.imp06.${Date.now()}@example.com`;
  const chefEmail = `chef.imp06.${Date.now()}@example.com`;
  const password = 'secret12';
  let ouvId;
  let chantierId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    const ouv = await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'ouvrier')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [ouvEmail, hash],
    );
    ouvId = ouv.rows[0].id;
    await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'chef_equipe')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [chefEmail, hash],
    );
    const ch = await query(
      `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_matin, heure_debut_apres_midi, heure_fin_apres_midi)
       VALUES ($1,'Site Imp06','08:00','12:00','13:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP06-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2) ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [ouvId, chantierId],
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
    const body = await res.json();
    assert.equal(res.status, 200);
    return body.accessToken;
  }

  it('creates period and syncs declaration soumise in one TX', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const day = '2026-07-10';
      const res = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: day,
          heure_debut: '08:00',
          heure_fin: '12:00',
          panier: true,
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(body.period.id);
      assert.equal(body.declaration.statut, 'soumise');
      assert.ok(body.declaration.heures_normales > 0);
    } finally {
      await close();
    }
  });

  it('soft-annulee when last period deleted (DR-IMP06-001)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const day = '2026-07-11';
      const create = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: day,
          heure_debut: '08:00',
          heure_fin: '10:00',
        }),
      });
      const created = await create.json();
      const del = await fetch(`${base}/api/timesheet/periods/${created.period.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(del.status, 200);
      const body = await del.json();
      assert.equal(body.declaration.statut, 'annulee');
      const still = await query(
        `SELECT * FROM declarations_heures WHERE user_id=$1 AND chantier_id=$2 AND date=$3`,
        [ouvId, chantierId, day],
      );
      assert.equal(still.rows.length, 1);
    } finally {
      await close();
    }
  });

  it('chef decides declaration and propagates periods', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const ouvToken = await login(base, ouvEmail);
      const day = '2026-07-12';
      const create = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvToken}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: day,
          heure_debut: '09:00',
          heure_fin: '11:00',
        }),
      });
      const created = await create.json();
      const chefToken = await login(base, chefEmail);
      const decide = await fetch(
        `${base}/api/timesheet/declarations/${created.declaration.id}/decide`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${chefToken}`,
          },
          body: JSON.stringify({ statut: 'validee' }),
        },
      );
      assert.equal(decide.status, 200);
      const decided = await decide.json();
      assert.equal(decided.declaration.statut, 'validee');
      assert.ok(decided.declaration.validated_by);
      const periods = await query(
        `SELECT statut FROM periodes_travail WHERE id=$1`,
        [created.period.id],
      );
      assert.equal(periods.rows[0].statut, 'validee');
    } finally {
      await close();
    }
  });

  it('permission: ouvrier cannot decide declaration', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const day = '2026-07-13';
      const create = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: day,
          heure_debut: '08:00',
          heure_fin: '09:00',
        }),
      });
      const created = await create.json();
      const forbid = await fetch(
        `${base}/api/timesheet/declarations/${created.declaration.id}/decide`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ statut: 'validee' }),
        },
      );
      assert.equal(forbid.status, 403);
    } finally {
      await close();
    }
  });
});
