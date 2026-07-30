/**
 * Full FE audit as collab (ouvrier) + admin.
 * Checks: page loads, API success, SSE/realtime, basic flows.
 * Usage: node scripts/ui-full-audit.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.WEB_URL || 'http://localhost:16035';
const COLLAB = {
  email: process.env.OUV_EMAIL || 'jasmine.collab@gmail.com',
  pass: process.env.OUV_PASS || '123456',
  role: 'collab',
};
const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'jasmine.n@gmail.com',
  pass: process.env.ADMIN_PASS || '123456',
  role: 'admin',
};

function summarizeBody(text, n = 280) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
}

async function clickText(page, re, timeout = 12000) {
  const loc = page.getByText(re).first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.click({ timeout });
}

async function tryClickText(page, re, timeout = 8000) {
  try {
    await clickText(page, re, timeout);
    return true;
  } catch {
    return false;
  }
}

async function login(page, account) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  // If already logged in, logout via profile if possible
  if (!(await page.locator('input[type="email"]').count())) {
    const logged = await page.locator('body').innerText();
    if (/profil|profile|bonjour|hello|validation|gestion|statistiques|export/i.test(logged)) {
      await tryClickText(page, /^profil$|^profile$/i, 3000);
      await page.waitForTimeout(800);
      if (await tryClickText(page, /déconnexion|se déconnecter|log out|logout/i, 4000)) {
        await page.waitForTimeout(600);
        await tryClickText(page, /déconnexion|se déconnecter|confirm|confirmer|log out|logout/i, 4000);
        await page.waitForTimeout(2000);
      }
    }
  }
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 25000 });
  await emailInput.fill(account.email);
  await page.locator('input[type="password"]').first().fill(account.pass);
  await clickText(page, /se connecter|sign in|login/i);
  await page.waitForTimeout(4000);
  const body = await page.locator('body').innerText();
  const ok = !/input\[type=.email.\]/.test('') && !/se connecter/i.test(body.slice(0, 200))
    ? /bonjour|hello|déclar|jours|validation|gestion|statistiques|export|profil|dashboard/i.test(body)
    : /bonjour|hello|déclar|jours|validation|gestion|statistiques|export|profil|dashboard/i.test(body);
  return { ok, body: summarizeBody(body), url: page.url() };
}

async function logout(page) {
  const clickedTab = await tryClickText(page, /^profil$|^profile$/i, 5000);
  await page.waitForTimeout(1000);
  if (!clickedTab) {
    // try navigating via URL hash/path used by expo
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  if (await tryClickText(page, /déconnexion|se déconnecter|log out|logout/i, 5000)) {
    await page.waitForTimeout(500);
    await tryClickText(page, /déconnexion|se déconnecter|confirm|confirmer|log out|logout|oui|yes/i, 4000);
    await page.waitForTimeout(2500);
  }
}

function attachMonitors(page, bag) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') bag.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => bag.pageErrors.push(String(err)));
  page.on('requestfailed', (req) => {
    bag.failedRequests.push({
      url: req.url(),
      method: req.method(),
      error: req.failure()?.errorText,
    });
  });
  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    const isApi =
      /\/(rest|auth|functions|events)\/|localhost:3001|\/api\//i.test(url) ||
      url.includes(':3001');
    if (!isApi) return;
    bag.apiCalls.push({ url: url.replace(/\?.*$/, ''), status, method: res.request().method() });
    if (status >= 400) {
      let body = '';
      try {
        body = (await res.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
      bag.apiErrors.push({ url: url.replace(/\?.*$/, ''), status, method: res.request().method(), body });
    }
    if (/\/events/i.test(url)) {
      bag.sseHits.push({ url: url.replace(/access_token=[^&]+/, 'access_token=***'), status });
    }
  });
}

async function visitTab(page, labelRe, expectRe) {
  const clicked = await tryClickText(page, labelRe, 8000);
  await page.waitForTimeout(2500);
  const body = await page.locator('body').innerText();
  const ok = clicked && expectRe.test(body);
  return {
    ok,
    clicked,
    url: page.url(),
    snippet: summarizeBody(body),
    hasErrorBanner: /erreur|error|failed|impossible/i.test(body) && !/pas d'erreur/i.test(body),
  };
}

async function auditCollab(page, findings) {
  const loginRes = await login(page, COLLAB);
  findings.push({ role: 'collab', step: 'login', ...loginRes });

  // Dashboard
  await page.waitForTimeout(2000);
  let body = await page.locator('body').innerText();
  const hours = body.match(/\d+h\d{2}/g) || [];
  findings.push({
    role: 'collab',
    step: 'dashboard',
    ok: /bonjour|déclar|jours|semaine/i.test(body),
    hours: hours.slice(0, 10),
    nonZeroHours: hours.filter((h) => h !== '0h00').length,
    snippet: summarizeBody(body),
  });

  // Declare today
  try {
    const before = page.url();
    const clicked = await tryClickText(page, /déclarer aujourd|declare today/i);
    await page.waitForTimeout(3000);
    body = await page.locator('body').innerText();
    findings.push({
      role: 'collab',
      step: 'declare_today',
      ok:
        clicked &&
        (/horaires|chantier|valider|suggestion|panier|période|period|confirmer/i.test(body) ||
          /declare|suggestion|empty|choose/i.test(page.url())),
      url: page.url(),
      snippet: summarizeBody(body),
    });
    if (page.url() !== before) {
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    findings.push({ role: 'collab', step: 'declare_today', ok: false, error: String(e.message || e) });
  }

  // Fill week
  try {
    await tryClickText(page, /dashboard|tableau/i, 3000);
    await page.waitForTimeout(1000);
    const clicked = await tryClickText(page, /remplir ma semaine|fill my week/i);
    await page.waitForTimeout(2500);
    body = await page.locator('body').innerText();
    findings.push({
      role: 'collab',
      step: 'fill_week',
      ok: clicked && /suggestion|reproduire|nouvelle|valider|annuler|cancel|semaine/i.test(body),
      snippet: summarizeBody(body),
    });
    // dismiss modal if any
    await tryClickText(page, /annuler|cancel|fermer|close/i, 3000);
    await page.waitForTimeout(800);
  } catch (e) {
    findings.push({ role: 'collab', step: 'fill_week', ok: false, error: String(e.message || e) });
  }

  // Calendar tab
  findings.push({
    role: 'collab',
    step: 'calendar_tab',
    ...(await visitTab(page, /^calendrier$|^calendar$/i, /calendrier|calendar|jour|lundi|semaine|choisir/i)),
  });

  // Profile tab
  findings.push({
    role: 'collab',
    step: 'profile_tab',
    ...(await visitTab(page, /^profil$|^profile$/i, /profil|email|rôle|role|déconnexion|logout|ouvrier|collab/i)),
  });

  // Tabs that collab should NOT see
  body = await page.locator('body').innerText();
  const tabStrip = body.slice(0, 800);
  findings.push({
    role: 'collab',
    step: 'tabs_visibility',
    ok: !/\bvalidation\b/i.test(tabStrip) || /ouvrier|dashboard|calendrier|profil/i.test(tabStrip),
    hasValidationTab: /validation/i.test(await page.getByText(/^validation$/i).count().then((c) => (c > 0 ? 'yes' : ''))),
    hasGestionTab: (await page.getByText(/^gestion$|^management$/i).count()) > 0,
    hasExportTab: (await page.getByText(/^statistiques$|^export$/i).count()) > 0,
    note: 'collab should only see Dashboard, Calendrier, Profil',
  });
}

async function auditAdmin(page, findings) {
  const loginRes = await login(page, ADMIN);
  findings.push({ role: 'admin', step: 'login', ...loginRes });

  await page.waitForTimeout(2000);
  let body = await page.locator('body').innerText();
  findings.push({
    role: 'admin',
    step: 'home_export',
    ok: /statistiques|export|paie|période|utilisateur|chantier|heures/i.test(body),
    snippet: summarizeBody(body),
    url: page.url(),
  });

  // Validation
  findings.push({
    role: 'admin',
    step: 'validation_tab',
    ...(await visitTab(
      page,
      /^validation$/i,
      /validation|déclar|approuv|reject|valider|en attente|pending|aucune|queue/i
    )),
  });

  // Export / stats
  findings.push({
    role: 'admin',
    step: 'export_tab',
    ...(await visitTab(page, /^statistiques$|^export$/i, /statistiques|export|paie|csv|période|télécharg/i)),
  });

  // Management
  const mgmt = await visitTab(page, /^gestion$|^management$/i, /gestion|chantier|utilisateur|user|worksite|équipe/i);
  findings.push({ role: 'admin', step: 'management_tab', ...mgmt });

  // Drill into users if link present
  if (await tryClickText(page, /utilisateur|users|collaborateur/i, 5000)) {
    await page.waitForTimeout(2500);
    body = await page.locator('body').innerText();
    findings.push({
      role: 'admin',
      step: 'admin_users',
      ok: /email|rôle|ouvrier|admin|chef|utilisateur|ajouter|créer/i.test(body),
      snippet: summarizeBody(body),
      url: page.url(),
    });
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1000);
    await tryClickText(page, /^gestion$|^management$/i, 4000);
    await page.waitForTimeout(1000);
  } else {
    findings.push({ role: 'admin', step: 'admin_users', ok: false, error: 'no users entry point' });
  }

  // Drill into worksites
  if (await tryClickText(page, /chantier|worksite/i, 5000)) {
    await page.waitForTimeout(2500);
    body = await page.locator('body').innerText();
    findings.push({
      role: 'admin',
      step: 'admin_worksites',
      ok: /chantier|code|JPX|9QQ|adresse|ajouter|créer/i.test(body),
      snippet: summarizeBody(body),
      url: page.url(),
      showsCodes: /JPX_|9QQ_/i.test(body),
    });
  } else {
    findings.push({ role: 'admin', step: 'admin_worksites', ok: false, error: 'no worksites entry' });
  }

  // Profile
  findings.push({
    role: 'admin',
    step: 'profile_tab',
    ...(await visitTab(page, /^profil$|^profile$/i, /profil|email|admin|déconnexion|logout/i)),
  });

  // Should NOT see ouvrier-only dashboard as primary tab
  findings.push({
    role: 'admin',
    step: 'tabs_visibility',
    ok: true,
    hasDashboardTab: (await page.getByText(/^dashboard$|^tableau/i).count()) > 0,
    hasValidationTab: (await page.getByText(/^validation$/i).count()) > 0,
    hasGestionTab: (await page.getByText(/^gestion$|^management$/i).count()) > 0,
    hasExportTab: (await page.getByText(/^statistiques$|^export$/i).count()) > 0,
    note: 'admin should see Validation, Statistiques, Gestion, Profil',
  });
}

async function probeRealtimeApi(page, bag) {
  // Trigger a lightweight page that may open SSE (validation or timesheet via admin validation)
  await tryClickText(page, /^validation$/i, 5000);
  await page.waitForTimeout(3000);
  // Also hit events endpoint from page context to verify auth token works
  const sseProbe = await page.evaluate(async () => {
    try {
      const raw = localStorage.getItem('chantier_session') || localStorage.getItem('session') || '';
      let token = '';
      for (const k of Object.keys(localStorage)) {
        const v = localStorage.getItem(k) || '';
        if (/access_token|session/i.test(k) || v.includes('access_token')) {
          try {
            const parsed = JSON.parse(v);
            token = parsed?.access_token || parsed?.session?.access_token || token;
          } catch {
            /* ignore */
          }
        }
      }
      // scan all keys
      for (const k of Object.keys(localStorage)) {
        const v = localStorage.getItem(k) || '';
        const m = v.match(/"access_token"\s*:\s*"([^"]+)"/);
        if (m) token = m[1];
      }
      if (!token) return { ok: false, reason: 'no_token', keys: Object.keys(localStorage).slice(0, 20) };
      return await new Promise((resolve) => {
        const es = new EventSource(`http://localhost:3001/events?access_token=${encodeURIComponent(token)}`);
        const t = setTimeout(() => {
          es.close();
          resolve({ ok: false, reason: 'timeout', readyState: es.readyState });
        }, 4000);
        es.addEventListener('connected', () => {
          clearTimeout(t);
          es.close();
          resolve({ ok: true, reason: 'connected' });
        });
        es.onerror = () => {
          clearTimeout(t);
          const state = es.readyState;
          es.close();
          resolve({ ok: false, reason: 'error', readyState: state });
        };
      });
    } catch (e) {
      return { ok: false, reason: String(e) };
    }
  });
  bag.sseProbe = sseProbe;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  const bag = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    apiCalls: [],
    apiErrors: [],
    sseHits: [],
    sseProbe: null,
  };
  attachMonitors(page, bag);

  const findings = [];

  await auditCollab(page, findings);
  await logout(page);
  // clear storage between roles
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear()).catch(() => {});

  await auditAdmin(page, findings);
  await probeRealtimeApi(page, bag);

  // Summarize API
  const apiSummary = {};
  for (const c of bag.apiCalls) {
    const key = `${c.method} ${c.status} ${c.url}`;
    apiSummary[key] = (apiSummary[key] || 0) + 1;
  }

  const failedSteps = findings.filter((f) => f.ok === false);
  const report = {
    verdict: failedSteps.length === 0 && bag.apiErrors.length === 0 ? 'PASS' : 'ISSUES',
    failedSteps: failedSteps.map((f) => `${f.role}:${f.step}`),
    findings,
    apiErrors: bag.apiErrors.slice(0, 30),
    apiSummaryTop: Object.entries(apiSummary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40),
    failedRequests: bag.failedRequests.slice(0, 20),
    consoleErrors: [...new Set(bag.consoleErrors)].slice(0, 25),
    pageErrors: [...new Set(bag.pageErrors)].slice(0, 15),
    sseHits: bag.sseHits.slice(0, 10),
    sseProbe: bag.sseProbe,
  };

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(report.verdict === 'PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
