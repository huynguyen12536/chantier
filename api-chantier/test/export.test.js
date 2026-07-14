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

describe('Imp-08 Reporting & Export', () => {
  const admEmail = `adm.imp08.${Date.now()}@example.com`;
  const ouvEmail = `ouv.imp08.${Date.now()}@example.com`;
  const password = 'secret12';
  let ouvId;
  let chantierId;
  let periodValideeId;
  let periodTermineeId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom)
       VALUES ($1,$2,'administratif','Admin','Imp08')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [admEmail, hash],
    );
    const ouv = await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom)
       VALUES ($1,$2,'ouvrier','Ouv','Imp08')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [ouvEmail, hash],
    );
    ouvId = ouv.rows[0].id;
    const ch = await query(
      `INSERT INTO chantiers (code, nom, adresse)
       VALUES ($1,'Export Site','1 rue Test')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP08-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;
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

  it('payroll returns only validee periods in range', async () => {
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
      assert.equal(body.periods.find((p) => p.id === periodValideeId).panier, true);
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

  it('stats counts validee and terminee', async () => {
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
    } finally {
      await close();
    }
  });
});
