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

describe('Imp-07 Review & Approval', () => {
  const ouvEmail = `ouv.imp07.${Date.now()}@example.com`;
  const chefEmail = `chef.imp07.${Date.now()}@example.com`;
  const chefOutEmail = `chef.out.imp07.${Date.now()}@example.com`;
  const password = 'secret12';
  let ouvId;
  let chefId;
  let chantierId;
  let otherChantierId;

  before(async () => {
    await runMigrations();
    const hash = await hashPassword(password);
    for (const [email, role] of [
      [ouvEmail, 'ouvrier'],
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
    chefId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefEmail])).rows[0].id;
    const ch = await query(
      `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_apres_midi)
       VALUES ($1,'Site Imp07','08:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP07-${Date.now()}`],
    );
    chantierId = ch.rows[0].id;
    const ch2 = await query(
      `INSERT INTO chantiers (code, nom)
       VALUES ($1,'Other Imp07')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP07-OTHER-${Date.now()}`],
    );
    otherChantierId = ch2.rows[0].id;
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2), ($3,$2)
       ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [ouvId, chantierId, chefId],
    );
    // Out-of-scope chef assigned only to other chantier
    const outId = (await query(`SELECT id FROM profiles WHERE email=$1`, [chefOutEmail])).rows[0]
      .id;
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2) ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [outId, otherChantierId],
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

  async function createSoumise(base, day, hours = { heure_debut: '08:00', heure_fin: '12:00' }) {
    const token = await login(base, ouvEmail);
    const res = await fetch(`${base}/api/timesheet/periods`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        chantier_id: chantierId,
        date: day,
        heure_debut: hours.heure_debut,
        heure_fin: hours.heure_fin,
        panier: false,
        deplacement: false,
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.declaration.statut, 'soumise', 'must remain soumise (no matching validated shift)');
    return body;
  }

  it('approve via /api/validation propagates periods with audit', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-20', {
        heure_debut: '07:00',
        heure_fin: '11:00',
      });
      const chefToken = await login(base, chefEmail);
      const res = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.declaration.statut, 'validee');
      assert.equal(body.declaration.validated_by, chefId);
      assert.ok(body.declaration.validated_at);
      const p = await query(`SELECT statut, validated_by FROM periodes_travail WHERE id=$1`, [
        created.period.id,
      ]);
      assert.equal(p.rows[0].statut, 'validee');
      assert.equal(p.rows[0].validated_by, chefId);
    } finally {
      await close();
    }
  });

  it('reject via /api/validation and queue lists soumise only', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-21', {
        heure_debut: '09:15',
        heure_fin: '13:15',
      });
      const chefToken = await login(base, chefEmail);
      const queue = await fetch(`${base}/api/validation/queue`, {
        headers: { authorization: `Bearer ${chefToken}` },
      });
      assert.equal(queue.status, 200);
      const qBody = await queue.json();
      assert.ok(qBody.declarations.some((d) => d.id === created.declaration.id));

      const res = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/reject`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(res.status, 200);
      assert.equal((await res.json()).declaration.statut, 'rejetee');
    } finally {
      await close();
    }
  });

  it('cancel keeps declaration annulee and deletes periods (Flow E)', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-22', {
        heure_debut: '10:00',
        heure_fin: '14:00',
      });
      const chefToken = await login(base, chefEmail);
      const res = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/cancel`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(res.status, 200);
      assert.equal((await res.json()).declaration.statut, 'annulee');
      const periods = await query(`SELECT id FROM periodes_travail WHERE id=$1`, [
        created.period.id,
      ]);
      assert.equal(periods.rows.length, 0);
      const decls = await query(`SELECT statut FROM declarations_heures WHERE id=$1`, [
        created.declaration.id,
      ]);
      assert.equal(decls.rows[0].statut, 'annulee');
    } finally {
      await close();
    }
  });

  it('chef out of scope gets 403 FORBIDDEN_SCOPE', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-23', {
        heure_debut: '06:30',
        heure_fin: '10:30',
      });
      const outToken = await login(base, chefOutEmail);
      const res = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${outToken}` } },
      );
      assert.equal(res.status, 403);
    } finally {
      await close();
    }
  });

  it('period decide path validates period with audit', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-24', {
        heure_debut: '11:00',
        heure_fin: '15:00',
      });
      const chefToken = await login(base, chefEmail);
      const res = await fetch(`${base}/api/validation/periods/${created.period.id}/decide`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefToken}`,
        },
        body: JSON.stringify({ statut: 'validee' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.period.statut, 'validee');
      assert.equal(body.period.validated_by, chefId);
    } finally {
      await close();
    }
  });

  it('double approve returns 409 conflict', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-25', {
        heure_debut: '13:00',
        heure_fin: '17:00',
      });
      const chefToken = await login(base, chefEmail);
      const first = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(first.status, 200);
      const second = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(second.status, 409);
    } finally {
      await close();
    }
  });

  it('return for correction writes rejetee + audit action return', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-26', {
        heure_debut: '08:30',
        heure_fin: '12:30',
      });
      const chefToken = await login(base, chefEmail);
      const res = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/return`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${chefToken}`,
          },
          body: JSON.stringify({ reason: 'missing GPS' }),
        },
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.declaration.statut, 'rejetee');
      const hist = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/history`,
        { headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(hist.status, 200);
      const hBody = await hist.json();
      assert.ok(hBody.events.some((e) => e.action === 'return' && e.reason === 'missing GPS'));
      const p = await query(`SELECT statut FROM periodes_travail WHERE id=$1`, [created.period.id]);
      assert.equal(p.rows[0].statut, 'rejetee');
    } finally {
      await close();
    }
  });

  it('ouvrier cannot approve; can read own history after chef approve', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-27', {
        heure_debut: '07:45',
        heure_fin: '11:45',
      });
      const ouvToken = await login(base, ouvEmail);
      const forbidden = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${ouvToken}` } },
      );
      assert.equal(forbidden.status, 403);

      const chefToken = await login(base, chefEmail);
      assert.equal(
        (
          await fetch(
            `${base}/api/validation/declarations/${created.declaration.id}/approve`,
            { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
          )
        ).status,
        200,
      );

      const hist = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/history`,
        { headers: { authorization: `Bearer ${ouvToken}` } },
      );
      assert.equal(hist.status, 200);
      const events = (await hist.json()).events;
      assert.ok(events.some((e) => e.action === 'approve'));
    } finally {
      await close();
    }
  });

  it('approve audit row persisted; failed second transition leaves first intact', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-28', {
        heure_debut: '14:00',
        heure_fin: '18:00',
      });
      const chefToken = await login(base, chefEmail);
      const ok = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/approve`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(ok.status, 200);
      const audits = await query(
        `SELECT action, to_statut FROM approval_audit_events WHERE declaration_id=$1`,
        [created.declaration.id],
      );
      assert.equal(audits.rows.length, 1);
      assert.equal(audits.rows[0].action, 'approve');

      const conflict = await fetch(
        `${base}/api/validation/declarations/${created.declaration.id}/reject`,
        { method: 'POST', headers: { authorization: `Bearer ${chefToken}` } },
      );
      assert.equal(conflict.status, 409);
      const decl = await query(`SELECT statut FROM declarations_heures WHERE id=$1`, [
        created.declaration.id,
      ]);
      assert.equal(decl.rows[0].statut, 'validee');
      const auditsAfter = await query(
        `SELECT COUNT(*)::int AS c FROM approval_audit_events WHERE declaration_id=$1`,
        [created.declaration.id],
      );
      assert.equal(auditsAfter.rows[0].c, 1);
    } finally {
      await close();
    }
  });

  it('period decide writes period_decide audit', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const created = await createSoumise(base, '2026-07-29', {
        heure_debut: '09:00',
        heure_fin: '12:00',
      });
      const chefToken = await login(base, chefEmail);
      const res = await fetch(`${base}/api/validation/periods/${created.period.id}/decide`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chefToken}`,
        },
        body: JSON.stringify({ statut: 'rejetee', reason: 'too short' }),
      });
      assert.equal(res.status, 200);
      const audits = await query(
        `SELECT action, entity_type, reason FROM approval_audit_events
         WHERE entity_id=$1 AND entity_type='period'`,
        [created.period.id],
      );
      assert.equal(audits.rows[0].action, 'period_decide');
      assert.equal(audits.rows[0].reason, 'too short');
    } finally {
      await close();
    }
  });
});
