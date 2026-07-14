import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import { mapPayrollPeriod } from '../src/modules/export/dto.js';

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

describe('Imp-08 Export DTO units', () => {
  it('maps panier storage to panier_repas FE field', () => {
    const mapped = mapPayrollPeriod({
      id: '1',
      date: '2026-07-01',
      user_id: 'u',
      chantier_id: 'c',
      heure_debut: '08:00',
      heure_fin: '12:00',
      panier: true,
      deplacement: false,
      statut: 'validee',
      user_nom: 'N',
      user_prenom: 'P',
      chantier_nom: 'Site',
      chantier_adresse: '1',
    });
    assert.equal(mapped.panier_repas, true);
    assert.equal(mapped.panier, true);
  });
});

describe('Imp-08 Reporting & Export', () => {
  const admEmail = `adm.imp08.${Date.now()}@example.com`;
  const chefEmail = `chef.imp08.${Date.now()}@example.com`;
  const chefOutEmail = `chef.out.imp08.${Date.now()}@example.com`;
  const ouvEmail = `ouv.imp08.${Date.now()}@example.com`;
  const password = 'secret12';
  let ouvId;
  let chefId;
  let chantierId;
  let otherChantierId;
  let periodValideeId;
  let periodTermineeId;
  let declarationId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    for (const [email, role, nom] of [
      [admEmail, 'administratif', 'Admin'],
      [chefEmail, 'chef_equipe', 'Chef'],
      [chefOutEmail, 'chef_equipe', 'Out'],
      [ouvEmail, 'ouvrier', 'Ouv'],
    ]) {
      await query(
        `INSERT INTO profiles (email, password_hash, role, nom, prenom)
         VALUES ($1,$2,$3,$4,'Imp08')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
        [email, hash, role, nom],
      );
    }
    ouvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [ouvEmail])).rows[0].id;
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    const outId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefOutEmail])).rows[0]
      .id;

    const ch = await query(
      `INSERT INTO chantiers (code, nom, adresse, heure_debut_matin, heure_fin_apres_midi)
       VALUES ($1,'Export Site','1 rue Test','08:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP08-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;
    const ch2 = await query(
      `INSERT INTO chantiers (code, nom)
       VALUES ($1,'Other Export')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP08-OTHER-${Date.now()}`],
    );
    otherChantierId = ch2.rows[0].id;

    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2), ($3,$2)
       ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [ouvId, chantierId, chefId],
    );
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2) ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [outId, otherChantierId],
    );

    const v = await query(
      `INSERT INTO periodes_travail
         (user_id, chantier_id, date, heure_debut, heure_fin, panier, deplacement, statut, validated_at)
       VALUES ($1,$2,'2026-07-01','08:00','12:00',true,false,'validee',NOW())
       RETURNING id`,
      [ouvId, chantierId],
    );
    periodValideeId = v.rows[0].id;
    const t = await query(
      `INSERT INTO periodes_travail
         (user_id, chantier_id, date, heure_debut, heure_fin, statut)
       VALUES ($1,$2,'2026-07-02','08:00','12:00','terminee')
       RETURNING id`,
      [ouvId, chantierId],
    );
    periodTermineeId = t.rows[0].id;

    const d = await query(
      `INSERT INTO declarations_heures
         (user_id, chantier_id, date, heures_normales, heures_supplementaires, nb_paniers, nb_deplacements, statut)
       VALUES ($1,$2,'2026-07-01',4,0,1,0,'validee')
       ON CONFLICT (user_id, chantier_id, date) DO UPDATE
         SET statut = EXCLUDED.statut, heures_normales = EXCLUDED.heures_normales
       RETURNING id`,
      [ouvId, chantierId],
    );
    declarationId = d.rows[0].id;
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

  it('payroll returns only validee periods with panier_repas FE field', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, admEmail);
      const res = await fetch(
        `${base}/api/export/payroll?from=2026-07-01&to=2026-07-31`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.periods.some((p) => p.id === periodValideeId));
      assert.ok(!body.periods.some((p) => p.id === periodTermineeId));
      const row = body.periods.find((p) => p.id === periodValideeId);
      assert.equal(row.panier_repas, true);
      assert.equal(row.panier, true);
      assert.equal(row.profiles.nom, 'Ouv');
      assert.equal(row.chantiers.nom, 'Export Site');
    } finally {
      await close();
    }
  });

  it('ouvrier cannot export', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(
        `${base}/api/export/payroll?from=2026-07-01&to=2026-07-31`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(res.status, 403);
    } finally {
      await close();
    }
  });

  it('stats counts and includes total_heures', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, admEmail);
      const res = await fetch(`${base}/api/export/stats`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.validees >= 1);
      assert.ok(body.en_attente >= 1);
      assert.ok(body.total_declarations >= body.validees + body.en_attente);
      assert.ok(typeof body.total_heures === 'number');
      assert.ok(body.total_heures >= 4);
    } finally {
      await close();
    }
  });

  it('chef sees only scoped chantier payroll; out-of-scope empty', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const inToken = await login(base, chefEmail);
      const inRes = await fetch(
        `${base}/api/export/payroll?from=2026-07-01&to=2026-07-31`,
        { headers: { authorization: `Bearer ${inToken}` } },
      );
      assert.equal(inRes.status, 200);
      const inBody = await inRes.json();
      assert.ok(inBody.periods.some((p) => p.id === periodValideeId));

      const outToken = await login(base, chefOutEmail);
      const outRes = await fetch(
        `${base}/api/export/payroll?from=2026-07-01&to=2026-07-31`,
        { headers: { authorization: `Bearer ${outToken}` } },
      );
      assert.equal(outRes.status, 200);
      assert.equal((await outRes.json()).periods.length, 0);
    } finally {
      await close();
    }
  });

  it('invalid range rejected; user declarations read for exporters', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const token = await login(base, admEmail);
      const bad = await fetch(`${base}/api/export/payroll?from=2026-07-31&to=2026-07-01`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(bad.status, 400);

      const res = await fetch(
        `${base}/api/export/declarations?user_id=${ouvId}&from=2026-07-01&to=2026-07-31`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.declarations.some((d) => d.id === declarationId));
      assert.equal(
        body.declarations.find((d) => d.id === declarationId).chantiers.nom,
        'Export Site',
      );
    } finally {
      await close();
    }
  });
});
