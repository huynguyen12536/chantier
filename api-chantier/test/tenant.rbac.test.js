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

async function login(base, email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { status: res.status, body, token: body.accessToken };
}

describe('Multi-tenant RBAC', () => {
  const password = 'secret12';
  const ts = Date.now();
  let defaultCompanyId;
  let adminToken;
  let systemAdminToken;
  let server;

  before(async () => {
    await runMigrations();
    const co = await query(`SELECT id FROM companies WHERE slug = 'default-company' LIMIT 1`);
    defaultCompanyId = co.rows[0]?.id;
    assert.ok(defaultCompanyId, 'default company must exist');

    const hash = await hashPassword(password);
    const saEmail = `sa.${ts}@example.com`;
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, company_id, actif)
       VALUES ($1,$2,'system_admin','SA','User',NULL,true)`,
      [saEmail, hash],
    );
    const adminEmail = `admin.${ts}@example.com`;
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, company_id, actif)
       VALUES ($1,$2,'admin','Co','Admin',$3,true)`,
      [adminEmail, hash, defaultCompanyId],
    );

    const app = createApp();
    server = await listen(app);
    const sa = await login(server.base, saEmail, password);
    systemAdminToken = sa.token;
    const ad = await login(server.base, adminEmail, password);
    adminToken = ad.token;
  });

  after(async () => {
    await server?.close();
    await closePool();
  });

  it('system_admin blocked from operational users POST', async () => {
    const res = await fetch(`${server.base}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${systemAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `ouv.${ts}@example.com`,
        password,
        role: 'ouvrier',
        nom: 'O',
        prenom: 'U',
      }),
    });
    assert.equal(res.status, 403);
  });

  it('system_admin can access platform dashboard', async () => {
    const res = await fetch(`${server.base}/api/platform/dashboard`, {
      headers: { Authorization: `Bearer ${systemAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.companies || body.stats || body.company);
  });

  it('company admin blocked from platform routes', async () => {
    const res = await fetch(`${server.base}/api/platform/companies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('company admin can list users in own company only', async () => {
    const res = await fetch(`${server.base}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.users));
    for (const u of body.users) {
      assert.equal(u.company_id, defaultCompanyId);
    }
  });

  it('system_admin can list platform users by role', async () => {
    const all = await fetch(`${server.base}/api/platform/users`, {
      headers: { Authorization: `Bearer ${systemAdminToken}` },
    });
    assert.equal(all.status, 200);

    const admins = await fetch(`${server.base}/api/platform/users?role=admin`, {
      headers: { Authorization: `Bearer ${systemAdminToken}` },
    });
    assert.equal(admins.status, 200);
    const adminBody = await admins.json();
    assert.ok(Array.isArray(adminBody.users));
    for (const u of adminBody.users) {
      assert.equal(u.role, 'admin');
    }

    const badRole = await fetch(`${server.base}/api/platform/users?role=system_admin`, {
      headers: { Authorization: `Bearer ${systemAdminToken}` },
    });
    assert.equal(badRole.status, 400);
  });

  it('system_admin can create company and company admin', async () => {
    const slug = `co-${ts}`;
    const createCo = await fetch(`${server.base}/api/platform/companies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${systemAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: `Co ${ts}`, slug }),
    });
    assert.equal(createCo.status, 201);
    const { company } = await createCo.json();

    const createAdmin = await fetch(`${server.base}/api/platform/users/company-admins`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${systemAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: company.id,
        email: `ca.${ts}@example.com`,
        password,
        nom: 'CA',
        prenom: 'User',
      }),
    });
    assert.equal(createAdmin.status, 201);
  });

  it('company admin creates chantier with tenant company_id via compat POST', async () => {
    const code = `TEN-${ts}`;
    const res = await fetch(`${server.base}/rest/v1/chantiers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, nom: `Site ${ts}`, adresse: '1 rue Test' }),
    });
    assert.equal(res.status, 201, await res.text());
    const chantier = await res.json();
    assert.equal(chantier.company_id, defaultCompanyId);
    assert.equal(chantier.nom, `Site ${ts}`);

    const otherCo = await query(
      `INSERT INTO companies (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`Other ${ts}`, `other-${ts}`],
    );
    const reject = await fetch(`${server.base}/rest/v1/chantiers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: `BAD-${ts}`,
        nom: 'Cross tenant',
        company_id: otherCo.rows[0].id,
      }),
    });
    assert.equal(reject.status, 403);
  });

  it('company admin cannot assign user from another company', async () => {
    const otherCo = await query(
      `INSERT INTO companies (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`AssignCo ${ts}`, `assign-co-${ts}`],
    );
    const otherCompanyId = otherCo.rows[0].id;
    const hash = await hashPassword(password);
    const otherUserEmail = `other.user.${ts}@example.com`;
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, company_id, actif)
       VALUES ($1,$2,'ouvrier','Other','User',$3,true)`,
      [otherUserEmail, hash, otherCompanyId],
    );
    const otherUserId = (await query(`SELECT id FROM profiles WHERE email=$1`, [otherUserEmail])).rows[0]
      .id;

    const ch = await query(
      `INSERT INTO chantiers (code, nom, company_id) VALUES ($1,$2,$3) RETURNING id`,
      [`ASSIGN-${ts}`, 'Own Chantier', defaultCompanyId],
    );

    const res = await fetch(`${server.base}/api/affectations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: otherUserId,
        chantier_id: ch.rows[0].id,
      }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN_TENANT');
  });

  it('company admin cannot soft-remove affectation from another company', async () => {
    const otherCo = await query(
      `INSERT INTO companies (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`RemoveCo ${ts}`, `remove-co-${ts}`],
    );
    const otherCompanyId = otherCo.rows[0].id;
    const hash = await hashPassword(password);
    const otherOuvEmail = `other.ouv.${ts}@example.com`;
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, company_id, actif)
       VALUES ($1,$2,'ouvrier','Other','Ouv',$3,true)`,
      [otherOuvEmail, hash, otherCompanyId],
    );
    const otherOuvId = (await query(`SELECT id FROM profiles WHERE email=$1`, [otherOuvEmail])).rows[0].id;
    const otherCh = await query(
      `INSERT INTO chantiers (code, nom, company_id) VALUES ($1,$2,$3) RETURNING id`,
      [`REM-${ts}`, 'Other Chantier', otherCompanyId],
    );
    const aff = await query(
      `INSERT INTO affectations_chantiers (user_id, chantier_id, company_id)
       VALUES ($1,$2,$3) RETURNING id`,
      [otherOuvId, otherCh.rows[0].id, otherCompanyId],
    );

    const res = await fetch(`${server.base}/api/affectations/${aff.rows[0].id}/soft-remove`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN_TENANT');
  });

  it('disabled company user can login but API calls are blocked', async () => {
    const disabledCo = await query(
      `INSERT INTO companies (name, slug, status) VALUES ($1,$2,'disabled') RETURNING id`,
      [`Disabled ${ts}`, `disabled-${ts}`],
    );
    const disabledCompanyId = disabledCo.rows[0].id;
    const disabledEmail = `disabled.${ts}@example.com`;
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO profiles (email, password_hash, role, nom, prenom, company_id, actif)
       VALUES ($1,$2,'ouvrier','Dis','User',$3,true)`,
      [disabledEmail, hash, disabledCompanyId],
    );

    const loginRes = await login(server.base, disabledEmail, password);
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.token);

    const usersRes = await fetch(`${server.base}/api/users`, {
      headers: { Authorization: `Bearer ${loginRes.token}` },
    });
    assert.equal(usersRes.status, 403);
    const usersBody = await usersRes.json();
    assert.equal(usersBody.error?.code, 'COMPANY_DISABLED');

    const profileRes = await fetch(`${server.base}/rest/v1/profiles/${loginRes.body.user.id}`, {
      headers: { Authorization: `Bearer ${loginRes.token}` },
    });
    assert.equal(profileRes.status, 403);
    const profileBody = await profileRes.json();
    assert.equal(profileBody.code, 'COMPANY_DISABLED');
  });
});
