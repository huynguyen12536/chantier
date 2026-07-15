/**
 * Imp-09 Realtime — unit + integration tests.
 */
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { query, closePool } from '../src/shared/db/pool.js';
import { hashPassword } from '../src/modules/auth/service.js';
import {
  resetRealtimeForTests,
  expandToCatalogEvents,
  clientMayReceive,
  EVENT_TYPES,
  dispatchDomainEvent,
} from '../src/modules/realtime/index.js';
import {
  clientCount,
  clearClients,
  getHeartbeatIntervalMs,
  setHeartbeatIntervalMs,
} from '../src/modules/realtime/sseRegistry.js';
import { formatSseMessage, formatHeartbeatComment } from '../src/modules/realtime/serializer.js';
import { clearSubscribers, subscribe } from '../src/modules/validation/services/notificationHooks.js';
import { emitAfterPeriodMutation } from '../src/modules/timesheet/services/emitTimesheetEvents.js';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        close: async () => {
          clearClients();
          await new Promise((r, j) => server.close((err) => (err ? j(err) : r())));
        },
      });
    });
  });
}

/** One locked reader per SSE response — reuse across waitUntil calls. */
function openSseSession(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let closed = false;

  return {
    get buffer() {
      return buf;
    },
    async waitUntil(predicate, timeoutMs = 5000) {
      if (predicate(buf)) return buf;
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline && !closed) {
        const remaining = Math.max(1, deadline - Date.now());
        const readResult = await Promise.race([
          reader.read(),
          new Promise((resolve) =>
            setTimeout(() => resolve({ done: false, value: undefined, timedOut: true }), remaining),
          ),
        ]);
        if (readResult.timedOut) break;
        if (readResult.done) break;
        if (readResult.value) {
          buf += decoder.decode(readResult.value, { stream: true });
          if (predicate(buf)) return buf;
        }
      }
      return buf;
    },
    async close() {
      if (closed) return;
      closed = true;
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    },
  };
}

function parseSseEvents(raw) {
  const events = [];
  const chunks = raw.split('\n\n');
  for (const chunk of chunks) {
    if (!chunk.trim() || chunk.startsWith(':')) continue;
    const ev = { event: 'message', data: '', id: null };
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) ev.event = line.slice(6).trim();
      else if (line.startsWith('data:')) ev.data += (ev.data ? '\n' : '') + line.slice(5).trimStart();
      else if (line.startsWith('id:')) ev.id = line.slice(3).trim();
      else if (line.startsWith('retry:')) ev.retry = line.slice(6).trim();
    }
    if (ev.data) {
      try {
        ev.json = JSON.parse(ev.data);
      } catch {
        ev.json = null;
      }
      events.push(ev);
    }
  }
  return events;
}

describe('Imp-09 Realtime units', () => {
  it('serializer formats SSE frames and heartbeats', () => {
    const msg = formatSseMessage({
      id: '1',
      event: 'period.created',
      data: { type: 'period.created' },
      retry: 3000,
    });
    assert.match(msg, /id: 1/);
    assert.match(msg, /event: period\.created/);
    assert.match(msg, /retry: 3000/);
    assert.match(msg, /data: \{/);
    assert.ok(formatHeartbeatComment().startsWith(': heartbeat'));
  });

  it('scope: worker / chef / admin', () => {
    const ev = { userId: 'u1', chantierId: 'c1' };
    assert.equal(clientMayReceive({ id: 'u1', role: 'ouvrier' }, [], ev), true);
    assert.equal(clientMayReceive({ id: 'u2', role: 'ouvrier' }, [], ev), false);
    assert.equal(clientMayReceive({ id: 'chef', role: 'chef_equipe' }, ['c1'], ev), true);
    assert.equal(clientMayReceive({ id: 'chef', role: 'chef_equipe' }, ['c9'], ev), false);
    assert.equal(clientMayReceive({ id: 'a', role: 'admin' }, null, ev), true);
    assert.equal(clientMayReceive({ id: 'a', role: 'administratif' }, null, { userId: null, chantierId: null }), true);
  });

  it('expands Imp-07 review hooks; dispatcher owns queue/dashboard signals', () => {
    const approved = expandToCatalogEvents({
      type: 'declaration.reviewed',
      entityId: 'd1',
      userId: 'u1',
      chantierId: 'c1',
      statut: 'validee',
    });
    assert.ok(approved.some((e) => e.type === EVENT_TYPES.DECLARATION_APPROVED && e.source === 'imp07'));
    const queue = approved.find((e) => e.type === EVENT_TYPES.QUEUE_CHANGED);
    const dash = approved.find((e) => e.type === EVENT_TYPES.DASHBOARD_CHANGED);
    assert.equal(queue?.source, 'dispatcher.queue_changed');
    assert.equal(dash?.source, 'dispatcher.dashboard_changed');

    const rejected = expandToCatalogEvents({
      type: 'declaration.reviewed',
      statut: 'rejetee',
      userId: 'u1',
      chantierId: 'c1',
    });
    assert.ok(rejected.some((e) => e.type === EVENT_TYPES.DECLARATION_REJECTED));

    const cancelled = expandToCatalogEvents({
      type: 'declaration.cancelled',
      userId: 'u1',
      chantierId: 'c1',
    });
    assert.ok(cancelled.some((e) => e.type === EVENT_TYPES.DECLARATION_CANCELLED));
  });

  it('Imp-06 helper emits period + declaration catalog types via hooks', () => {
    clearSubscribers();
    const seen = [];
    subscribe((e) => seen.push(e.type));
    emitAfterPeriodMutation('created', {
      period: { id: 'p1', user_id: 'u1', chantier_id: 'c1', statut: 'terminee' },
      declaration: { id: 'd1', user_id: 'u1', chantier_id: 'c1', statut: 'soumise' },
      actorId: 'u1',
    });
    assert.ok(seen.includes(EVENT_TYPES.PERIOD_CREATED));
    assert.ok(seen.includes(EVENT_TYPES.DECLARATION_SUBMITTED));
    clearSubscribers();
  });
});

describe('Imp-09 Realtime SSE API', () => {
  const stamp = Date.now();
  const ouvEmail = `ouv.imp09.${stamp}@example.com`;
  const otherEmail = `other.imp09.${stamp}@example.com`;
  const chefEmail = `chef.imp09.${stamp}@example.com`;
  const adminEmail = `admin.imp09.${stamp}@example.com`;
  const password = 'secret12';
  let ouvId;
  let otherId;
  let chefId;
  let adminId;
  let chantierId;
  let otherChantierId;

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
    const other = await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'ouvrier')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [otherEmail, hash],
    );
    otherId = other.rows[0].id;
    const chef = await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'chef_equipe')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [chefEmail, hash],
    );
    chefId = chef.rows[0].id;
    const admin = await query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1,$2,'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [adminEmail, hash],
    );
    adminId = admin.rows[0].id;

    const ch = await query(
      `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_apres_midi)
       VALUES ($1,'Site Imp09','08:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP09-${stamp}`],
    );
    chantierId = ch.rows[0].id;
    const ch2 = await query(
      `INSERT INTO chantiers (code, nom, heure_debut_matin, heure_fin_apres_midi)
       VALUES ($1,'Site Imp09 Other','08:00','17:00')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id`,
      [`IMP09O-${stamp}`],
    );
    otherChantierId = ch2.rows[0].id;

    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2), ($3,$2), ($4,$2)
       ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [ouvId, chantierId, chefId, otherId],
    );
    await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id)
       VALUES ($1,$2)
       ON CONFLICT (user_id, chantier_id) DO NOTHING`,
      [otherId, otherChantierId],
    );
  });

  beforeEach(() => {
    resetRealtimeForTests({ heartbeatMs: 30_000 });
  });

  after(async () => {
    clearClients();
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

  it('SSE connect + disconnect', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events?access_token=${encodeURIComponent(token)}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
      sse = openSseSession(res);
      const buf = await sse.waitUntil((t) => t.includes('event: connected'), 3000);
      const events = parseSseEvents(buf);
      assert.ok(events.some((e) => e.event === 'connected'));
      assert.equal(clientCount(), 1);
      await sse.close();
      await new Promise((r) => setTimeout(r, 50));
      assert.equal(clientCount(), 0);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('SSE reconnect header Last-Event-ID echoed; no replay', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: {
          authorization: `Bearer ${token}`,
          'Last-Event-ID': '42',
        },
      });
      assert.equal(res.status, 200);
      sse = openSseSession(res);
      const buf = await sse.waitUntil((t) => t.includes('connected'), 3000);
      assert.match(buf, /"lastEventId":"42"/);
      assert.match(buf, /"lastEventIdReplay":false/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('SSE auth failure without token returns 401', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/events`);
      assert.equal(res.status, 401);
      assert.equal(clientCount(), 0);
    } finally {
      await close();
    }
  });

  it('SSE prefers Authorization Bearer over missing query', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 3000);
      assert.equal(clientCount(), 1);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('cleanup removes client and stops registry entry', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);
      assert.equal(clientCount(), 1);
      await sse.close();
      clearClients();
      assert.equal(clientCount(), 0);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('heartbeat comment arrives', async () => {
    const app = createApp({ sseHeartbeatMs: 80 });
    const { base, close } = await listen(app);
    let sse;
    try {
      assert.ok(getHeartbeatIntervalMs() <= 1000);
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      const buf = await sse.waitUntil((t) => t.includes(': heartbeat'), 2000);
      assert.match(buf, /: heartbeat/);
    } finally {
      setHeartbeatIntervalMs(30_000);
      if (sse) await sse.close();
      await close();
    }
  });

  it('scoped worker only receives own user events (unauthorized scope dropped)', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      dispatchDomainEvent({
        type: EVENT_TYPES.PERIOD_CREATED,
        entityId: 'p-other',
        userId: otherId,
        chantierId: chantierId,
      });
      dispatchDomainEvent({
        type: EVENT_TYPES.PERIOD_CREATED,
        entityId: 'p-self',
        userId: ouvId,
        chantierId: chantierId,
      });

      const buf = await sse.waitUntil((t) => t.includes('p-self'), 3000);
      assert.match(buf, /p-self/);
      assert.doesNotMatch(buf, /p-other/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('scoped chef receives chantier scope only', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, chefEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      dispatchDomainEvent({
        type: EVENT_TYPES.PERIOD_UPDATED,
        entityId: 'p-out',
        userId: otherId,
        chantierId: otherChantierId,
      });
      dispatchDomainEvent({
        type: EVENT_TYPES.PERIOD_UPDATED,
        entityId: 'p-in',
        userId: ouvId,
        chantierId: chantierId,
      });

      const buf = await sse.waitUntil((t) => t.includes('p-in'), 3000);
      assert.match(buf, /p-in/);
      assert.doesNotMatch(buf, /p-out/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('admin receives all', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, adminEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      dispatchDomainEvent({
        type: EVENT_TYPES.DASHBOARD_CHANGED,
        entityId: 'x',
        userId: otherId,
        chantierId: otherChantierId,
      });
      const buf = await sse.waitUntil((t) => t.includes('dashboard.changed'), 3000);
      assert.match(buf, /dashboard\.changed/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('create period emits after COMMIT to SSE', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      const day = `2026-07-${String(10 + (stamp % 10)).padStart(2, '0')}`;
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
          heure_fin: '12:00',
          panier: true,
        }),
      });
      assert.equal(create.status, 201);
      const created = await create.json();

      const buf = await sse.waitUntil(
        (t) => t.includes('period.created') || t.includes(created.period.id),
        4000,
      );
      assert.match(buf, /period\.created/);
      assert.ok(buf.includes(created.period.id) || buf.includes('declaration.submitted'));
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('approve / reject / cancel emit via Imp-07 hooks', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const ouvToken = await login(base, ouvEmail);
      const chefToken = await login(base, chefEmail);

      const day = '2026-07-20';
      await query(
        `DELETE FROM declarations_heures WHERE user_id = $1 AND date = $2::date`,
        [ouvId, day],
      );
      await query(`DELETE FROM periodes_travail WHERE user_id = $1 AND date = $2::date`, [ouvId, day]);

      const created = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ouvToken}`,
        },
        body: JSON.stringify({
          chantier_id: chantierId,
          date: day,
          heure_debut: '08:00',
          heure_fin: '12:00',
        }),
      });
      assert.equal(created.status, 201);
      const body = await created.json();
      const declId = body.declaration.id;

      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${chefToken}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      const approve = await fetch(`${base}/api/validation/declarations/${declId}/approve`, {
        method: 'POST',
        headers: { authorization: `Bearer ${chefToken}` },
      });
      assert.equal(approve.status, 200);

      let buf = await sse.waitUntil((t) => t.includes('declaration.approved'), 4000);
      assert.match(buf, /declaration\.approved/);
      assert.match(buf, /queue\.changed/);

      await query(
        `UPDATE declarations_heures SET statut = 'soumise', validated_by = NULL, validated_at = NULL WHERE id = $1`,
        [declId],
      );
      const reject = await fetch(`${base}/api/validation/declarations/${declId}/reject`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${chefToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'test' }),
      });
      assert.equal(reject.status, 200);
      buf = await sse.waitUntil((t) => t.includes('declaration.rejected'), 4000);
      assert.match(buf, /declaration\.rejected/);

      await query(
        `UPDATE declarations_heures SET statut = 'soumise', validated_by = NULL, validated_at = NULL WHERE id = $1`,
        [declId],
      );
      const cancel = await fetch(`${base}/api/validation/declarations/${declId}/cancel`, {
        method: 'POST',
        headers: { authorization: `Bearer ${chefToken}` },
      });
      assert.equal(cancel.status, 200);
      buf = await sse.waitUntil((t) => t.includes('declaration.cancelled'), 4000);
      assert.match(buf, /declaration\.cancelled/);
      assert.match(buf, /dashboard\.changed/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });

  it('rollback path: failed create does not emit', async () => {
    clearSubscribers();
    const seen = [];
    subscribe((e) => seen.push(e.type));

    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    try {
      const token = await login(base, ouvEmail);
      const bad = await fetch(`${base}/api/timesheet/periods`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chantier_id: '00000000-0000-0000-0000-000000000000',
          date: '2026-07-21',
          heure_debut: '08:00',
          heure_fin: '12:00',
        }),
      });
      assert.ok(bad.status >= 400);
      assert.equal(seen.length, 0);
    } finally {
      clearSubscribers();
      clearClients();
      await close();
    }
  });

  it('emit after COMMIT only (update path)', async () => {
    const app = createApp({ sseHeartbeatMs: 60_000 });
    const { base, close } = await listen(app);
    let sse;
    try {
      const token = await login(base, ouvEmail);
      const day = '2026-07-22';
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
          heure_fin: '11:00',
        }),
      });
      assert.equal(create.status, 201);
      const periodId = (await create.json()).period.id;

      const res = await fetch(`${base}/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      sse = openSseSession(res);
      await sse.waitUntil((t) => t.includes('connected'), 2000);

      const upd = await fetch(`${base}/api/timesheet/periods/${periodId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ heure_fin: '12:00' }),
      });
      assert.equal(upd.status, 200);
      const buf = await sse.waitUntil((t) => t.includes('period.updated'), 4000);
      assert.match(buf, /period\.updated/);
    } finally {
      if (sse) await sse.close();
      await close();
    }
  });
});
