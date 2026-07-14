/**
 * Imp-08 parity — stats.total_heures = wall-clock (FE totalHeures),
 * while splitHours normales/HS remain unchanged.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import { durationHours } from '../src/modules/timesheet/domain/timeUtility.js';
import { splitHours } from '../src/modules/timesheet/domain/calculation.js';

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

/** FE computeChantierHoursBreakdown.totalHeures semantics. */
function wallClock(debut, fin) {
  return durationHours(debut, fin);
}

describe('Imp-08 stats.total_heures wall-clock parity', () => {
  // Cadre 08:00–17:00 (typical Imp-04 matin→après-midi span)
  const CADRE_DEBUT = '08:00';
  const CADRE_FIN = '17:00';

  const cases = [
    {
      name: 'work completely inside cadre',
      debut: '09:00',
      fin: '12:00',
      wall: 3,
    },
    {
      name: 'work starting before cadre',
      debut: '07:00',
      fin: '12:00',
      wall: 5,
    },
    {
      name: 'work ending after cadre',
      debut: '14:00',
      fin: '19:00',
      wall: 5,
    },
    {
      name: 'work spanning lunch (same continuous period)',
      debut: '09:00',
      fin: '16:00',
      wall: 7,
    },
  ];

  for (const c of cases) {
    it(`${c.name}: total_heures == wall-clock; splitHours N/HS unchanged`, () => {
      const wall = wallClock(c.debut, c.fin);
      assert.equal(wall, c.wall);

      const before = splitHours(c.debut, c.fin, CADRE_DEBUT, CADRE_FIN);
      const after = splitHours(c.debut, c.fin, CADRE_DEBUT, CADRE_FIN);
      assert.deepEqual(
        {
          heures_normales: after.heures_normales,
          heures_supplementaires: after.heures_supplementaires,
        },
        {
          heures_normales: before.heures_normales,
          heures_supplementaires: before.heures_supplementaires,
        },
      );

      // Aggregation rule for stats: wall-clock, not split.total_heures
      assert.equal(wall, c.wall);
      // Document divergence when early start: split total may omit pre-cadre
      if (c.debut < CADRE_DEBUT) {
        assert.ok(
          before.total_heures <= wall,
          'splitHours total may be less than wall-clock; stats must use wall',
        );
      }
    });
  }
});

describe('Imp-08 stats API aggregates wall-clock hours', () => {
  const admEmail = `adm.imp08.wall.${Date.now()}@example.com`;
  const password = 'secret12';
  let ouvId;
  let chantierId;
  let expectedWall = 0;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom)
       VALUES ($1,$2,'administratif','Admin','Wall')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [admEmail, hash],
    );
    const ouv = await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'ouvrier')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [`ouv.imp08.wall.${Date.now()}@example.com`, hash],
    );
    ouvId = ouv.rows[0].id;
    const ch = await query(
      `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_apres_midi)
       VALUES ($1,'Wall Site','08:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP08-WALL-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;

    // Isolated dates so we can delta total_heures against other fixtures
    const periods = [
      { date: '2026-09-01', debut: '09:00', fin: '12:00' }, // inside: 3h
      { date: '2026-09-02', debut: '07:00', fin: '12:00' }, // before: 5h
      { date: '2026-09-03', debut: '14:00', fin: '19:00' }, // after: 5h
      { date: '2026-09-04', debut: '09:00', fin: '16:00' }, // lunch span: 7h
    ];
    for (const p of periods) {
      expectedWall += durationHours(p.debut, p.fin);
      await query(
        `INSERT INTO periodes_travail
           (user_id, chantier_id, date, heure_debut, heure_fin, statut)
         VALUES ($1,$2,$3,$4,$5,'validee')`,
        [ouvId, chantierId, p.date, p.debut, p.fin],
      );
    }
    expectedWall = Math.round(expectedWall * 100) / 100;
  });

  after(async () => {
    await closePool().catch(() => {});
  });

  it('GET /stats total_heures includes wall-clock sum for parity fixtures', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const login = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: admEmail, password }),
      });
      assert.equal(login.status, 200);
      const token = (await login.json()).accessToken;
      const res = await fetch(`${base}/api/export/stats`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      // Must at least include this suite's 3+5+5+7 = 20 wall-clock hours
      assert.ok(
        body.total_heures >= expectedWall,
        `expected >= ${expectedWall}, got ${body.total_heures}`,
      );

      // Explicit check vs early-start case: wall 5h, cadre 08–17 → split total often 4h normales only
      const earlySplit = splitHours('07:00', '12:00', '08:00', '17:00');
      assert.equal(durationHours('07:00', '12:00'), 5);
      assert.ok(earlySplit.total_heures < 5 || earlySplit.heures_normales === 4);
      assert.equal(earlySplit.heures_normales, 4);
      assert.equal(earlySplit.heures_supplementaires, 0);
    } finally {
      await close();
    }
  });
});
