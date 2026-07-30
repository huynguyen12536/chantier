/**
 * End-to-end business flow smoke (API).
 * Usage: node scripts/flow-e2e-smoke.mjs
 */
const API = process.env.API_URL || 'http://localhost:3001';
const PASS = '123456';
const stamp = Date.now();

const results = [];

function ok(step, detail = {}) {
  results.push({ step, ok: true, ...detail });
  console.log(`PASS  ${step}`, detail.note || '');
}

function fail(step, err, detail = {}) {
  const message = err?.message || String(err);
  results.push({ step, ok: false, error: message, ...detail });
  console.log(`FAIL  ${step}: ${message}`);
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${res.status} ${path}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function login(email, password = PASS) {
  const data = await req('POST', '/auth/v1/token?grant_type=password', {
    body: { email, password },
  });
  return { token: data.access_token, user: data.user };
}

async function main() {
  // ── 1. System admin login ──────────────────────────────────────────
  let sys;
  try {
    sys = await login('system.admin@local.test');
    ok('sysadmin_login', { role: sys.user.role, email: sys.user.email });
  } catch (e) {
    fail('sysadmin_login', e);
    printSummary();
    process.exit(1);
  }

  // ── 2. Create company ──────────────────────────────────────────────
  let company;
  try {
    const slug = `flow-co-${stamp}`;
    const created = await req('POST', '/api/platform/companies', {
      token: sys.token,
      body: {
        name: `Flow Test Co ${stamp}`,
        slug,
        status: 'active',
        address: '1 rue Flow Test',
        tax_id: 'CHE-123.456.789',
      },
    });
    company = created.company;
    ok('create_company', { id: company.id, slug: company.slug });
  } catch (e) {
    fail('create_company', e);
  }

  // ── 3. List companies ──────────────────────────────────────────────
  try {
    const listed = await req('GET', '/api/platform/companies', { token: sys.token });
    const found = (listed.companies || []).some((c) => c.id === company?.id);
    if (!found) throw new Error('created company not in list');
    ok('list_companies', { count: listed.companies.length });
  } catch (e) {
    fail('list_companies', e);
  }

  // ── 4. Platform dashboard ──────────────────────────────────────────
  try {
    const dash = await req('GET', '/api/platform/dashboard', { token: sys.token });
    ok('platform_dashboard', {
      note: `keys=${Object.keys(dash).slice(0, 8).join(',')}`,
    });
  } catch (e) {
    fail('platform_dashboard', e);
  }

  // ── 5. Create company admin ────────────────────────────────────────
  const adminEmail = `admin.flow.${stamp}@test.local`;
  let companyAdmin;
  try {
    if (!company) throw new Error('no company');
    const created = await req('POST', '/api/platform/users/company-admins', {
      token: sys.token,
      body: {
        company_id: company.id,
        email: adminEmail,
        password: PASS,
        nom: 'Flow',
        prenom: 'Admin',
      },
    });
    companyAdmin = created.user;
    ok('create_company_admin', { id: companyAdmin.id, email: adminEmail });
  } catch (e) {
    fail('create_company_admin', e);
  }

  // ── 6. Company admin login ─────────────────────────────────────────
  let admin;
  try {
    admin = await login(adminEmail);
    if (admin.user.role !== 'admin') throw new Error(`expected admin got ${admin.user.role}`);
    if (admin.user.company_id !== company.id) throw new Error('wrong company_id on admin');
    ok('company_admin_login', { company_id: admin.user.company_id });
  } catch (e) {
    fail('company_admin_login', e);
  }

  // ── 7. Admin creates ouvrier + chef ────────────────────────────────
  const ouvEmail = `ouvrier.flow.${stamp}@test.local`;
  const chefEmail = `chef.flow.${stamp}@test.local`;
  let ouvrier;
  let chef;
  try {
    if (!admin) throw new Error('no admin session');
    ouvrier = await req('POST', '/api/users', {
      token: admin.token,
      body: {
        email: ouvEmail,
        password: PASS,
        role: 'ouvrier',
        nom: 'Flow',
        prenom: 'Ouvrier',
      },
    });
    ok('create_ouvrier', { id: ouvrier.id || ouvrier.user?.id, email: ouvEmail });
  } catch (e) {
    fail('create_ouvrier', e);
  }

  try {
    if (!admin) throw new Error('no admin session');
    chef = await req('POST', '/api/users', {
      token: admin.token,
      body: {
        email: chefEmail,
        password: PASS,
        role: 'chef_equipe',
        nom: 'Flow',
        prenom: 'Chef',
      },
    });
    ok('create_chef', { id: chef.id || chef.user?.id, email: chefEmail });
  } catch (e) {
    fail('create_chef', e);
  }

  // ── 8. List users (tenant scoped) ──────────────────────────────────
  try {
    if (!admin) throw new Error('no admin session');
    const users = await req('GET', '/api/users', { token: admin.token });
    const list = users.users || users || [];
    const emails = (Array.isArray(list) ? list : []).map((u) => u.email);
    if (!emails.includes(ouvEmail) || !emails.includes(chefEmail)) {
      throw new Error(`missing created users in list: ${emails.join(',')}`);
    }
    ok('list_tenant_users', { count: list.length });
  } catch (e) {
    fail('list_tenant_users', e);
  }

  // ── 9. Admin creates chantier ──────────────────────────────────────
  let chantier;
  try {
    if (!admin) throw new Error('no admin session');
    chantier = await req('POST', '/api/chantiers', {
      token: admin.token,
      body: {
        nom: `Chantier Flow ${stamp}`,
        adresse: '10 Avenue Test',
        date_debut: new Date().toISOString().slice(0, 10),
        heure_debut_matin: '07:30',
        heure_fin_matin: '12:00',
        heure_debut_apres_midi: '13:00',
        heure_fin_apres_midi: '16:45',
        actif: true,
      },
    });
    const id = chantier.id || chantier.chantier?.id;
    if (!id) throw new Error(`no id in response ${JSON.stringify(chantier)}`);
    chantier = { ...chantier, id };
    ok('create_chantier', { id: chantier.id, code: chantier.code });
  } catch (e) {
    fail('create_chantier', e);
  }

  // ── 10. List chantiers ─────────────────────────────────────────────
  try {
    if (!admin) throw new Error('no admin session');
    const listed = await req('GET', '/api/chantiers', { token: admin.token });
    const rows = listed.chantiers || listed || [];
    const found = (Array.isArray(rows) ? rows : []).some((c) => c.id === chantier?.id);
    if (!found) throw new Error('created chantier not listed');
    ok('list_chantiers', { count: Array.isArray(rows) ? rows.length : '?' });
  } catch (e) {
    fail('list_chantiers', e);
  }

  // ── 11. Affectation ouvrier → chantier ─────────────────────────────
  try {
    if (!admin || !chantier || !ouvrier) throw new Error('missing deps');
    const ouvId = ouvrier.id || ouvrier.user?.id;
    const chefId = chef?.id || chef?.user?.id || null;
    await req('POST', '/api/affectations', {
      token: admin.token,
      body: {
        user_id: ouvId,
        chantier_id: chantier.id,
        chef_equipe_id: chefId,
        date_debut: new Date().toISOString().slice(0, 10),
      },
    });
    ok('assign_ouvrier_to_chantier', { chantier_id: chantier.id, user_id: ouvId });
  } catch (e) {
    fail('assign_ouvrier_to_chantier', e);
  }

  // ── 12. Ouvrier login + create divers demande ──────────────────────
  let ouvSession;
  let divers;
  try {
    ouvSession = await login(ouvEmail);
    ok('ouvrier_login', { role: ouvSession.user.role });
  } catch (e) {
    fail('ouvrier_login', e);
  }

  try {
    if (!ouvSession) throw new Error('no ouvrier session');
    divers = await req('POST', '/rest/v1/rpc/create_chantier_divers', {
      token: ouvSession.token,
      body: {
        p_nom: `Divers Flow ${stamp}`,
        p_adresse: '99 Rue Divers',
        p_motif: 'Test flow divers',
        p_heure_debut: '08:00',
        p_heure_fin: '17:00',
      },
    });
    // response shape may vary
    const id = divers?.id || divers?.chantier_id || divers?.chantier?.id;
    if (!id && divers?.error) throw new Error(JSON.stringify(divers));
    // some RPCs return the row directly or { data }
    const row = divers?.data || divers;
    divers = { ...row, id: row.id || id };
    if (!divers.id) throw new Error(`no divers id: ${JSON.stringify(divers)}`);
    ok('create_chantier_divers', {
      id: divers.id,
      statut: divers.divers_statut || divers.statut,
    });
  } catch (e) {
    fail('create_chantier_divers', e);
  }

  // ── 13. Admin approves divers ──────────────────────────────────────
  try {
    if (!admin || !divers?.id) throw new Error('missing deps');
    const approved = await req('POST', '/rest/v1/rpc/approve_chantier_divers', {
      token: admin.token,
      body: {
        p_chantier_id: divers.id,
        p_heure_debut: '08:00',
        p_heure_fin: '17:00',
      },
    });
    ok('approve_chantier_divers', {
      note: JSON.stringify(approved).slice(0, 120),
    });
  } catch (e) {
    fail('approve_chantier_divers', e);
  }

  // ── 14. Existing known accounts still login ────────────────────────
  for (const [email, expectedRole] of [
    ['joseph.ad@arson-concept.ch', 'admin'],
    ['jasmine.collab@gmail.com', 'ouvrier'],
    ['huynguyen12536@gmail.com', 'ouvrier'],
  ]) {
    try {
      const s = await login(email);
      if (s.user.role !== expectedRole) {
        throw new Error(`expected ${expectedRole} got ${s.user.role}`);
      }
      ok(`login_existing_${expectedRole}_${email.split('@')[0]}`, { email });
    } catch (e) {
      fail(`login_existing_${email}`, e);
    }
  }

  // ── 15. OTP send still works ───────────────────────────────────────
  try {
    await req('POST', '/functions/v1/send-password-reset-otp', {
      body: { email: 'huynguyen12536@gmail.com', lang: 'fr' },
    });
    ok('send_password_reset_otp');
  } catch (e) {
    // rate limit is acceptable
    if (e.status === 429 || String(e.message).includes('rate_limited')) {
      ok('send_password_reset_otp', { note: 'rate_limited (acceptable)' });
    } else {
      fail('send_password_reset_otp', e);
    }
  }

  // ── 16. Verify OTP endpoint exists (invalid code → 400 not 404) ────
  try {
    await req('POST', '/functions/v1/verify-password-reset-otp', {
      body: { email: 'huynguyen12536@gmail.com', otp: '000000' },
    });
    fail('verify_otp_endpoint', new Error('expected 400 for bad otp'));
  } catch (e) {
    if (e.status === 404) fail('verify_otp_endpoint', e);
    else if (e.status === 400) ok('verify_otp_endpoint', { note: 'returns 400 for bad otp (not 404)' });
    else fail('verify_otp_endpoint', e);
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('\n========== FLOW E2E SUMMARY ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${results.length}`);
  for (const r of results.filter((x) => !x.ok)) {
    console.log(` - FAIL ${r.step}: ${r.error}`);
  }
  console.log('======================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
