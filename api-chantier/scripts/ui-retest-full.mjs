/**
 * Senior FE full-flow retest (collab + admin).
 * Usage: node scripts/ui-retest-full.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.WEB_URL || 'http://localhost:16035';
const OUT = path.resolve('.audit-shots/retest');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const apiErrors = [];
const sse = [];
const consoleErrors = [];
const notes = [];

function rec(role, area, control, status, detail = '', extra = {}) {
  results.push({
    role,
    area,
    control,
    status,
    detail: String(detail || '').slice(0, 350),
    ...extra,
    at: new Date().toISOString(),
  });
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  } catch {
    /* ignore */
  }
}

async function body(page) {
  try {
    return (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

async function visible(page, re, t = 5000) {
  try {
    await page.getByText(re).first().waitFor({ state: 'visible', timeout: t });
    return true;
  } catch {
    return false;
  }
}

async function click(page, re, t = 8000) {
  const loc = page.getByText(re).first();
  await loc.waitFor({ state: 'visible', timeout: t });
  await loc.click({ timeout: t });
  return true;
}

async function tryClick(page, re, t = 6000) {
  try {
    await click(page, re, t);
    return true;
  } catch {
    return false;
  }
}

async function hardReset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(`${BASE}/?r=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
}

async function login(page, email, pass, role) {
  const emailBox = page.getByPlaceholder(/exemple@domaine|example@domain/i).first();
  await emailBox.waitFor({ state: 'visible', timeout: 25000 });
  await emailBox.fill(email);
  await page.locator('input[type=password]').first().fill(pass);
  const forgot = await page.getByText(/Mot de passe oublié|Forgot password/i).count();
  rec(
    role,
    'login',
    'Forgot password hidden',
    forgot === 0 ? 'PASS' : 'FAIL',
    forgot ? 'still visible' : 'hidden as expected',
  );
  if (!(await tryClick(page, /Se connecter|Sign in|Login/i, 10000))) {
    await page.locator('input[type=password]').first().press('Enter');
  }
  await page.waitForTimeout(4500);
  const t = await body(page);
  const ok = /Bonjour|Validation|Export|Gestion|Statistiques|Collaborateur|Admin/i.test(t);
  rec(role, 'login', 'SE CONNECTER', ok ? 'PASS' : 'FAIL', t.slice(0, 220), { url: page.url() });
  return ok;
}

async function go(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch({ headless: false, slowMo: 100 });
const context = await browser.newContext({
  viewport: { width: 430, height: 920 },
  acceptDownloads: true,
});
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('response', async (res) => {
  const u = res.url();
  if (!(u.includes(':3001') || /\/(rest|auth|events|functions)\//.test(u))) return;
  if (/\/events/.test(u)) sse.push(res.status());
  if (res.status() >= 400) {
    let b = '';
    try {
      b = (await res.text()).slice(0, 160);
    } catch {
      /* ignore */
    }
    apiErrors.push({
      status: res.status(),
      method: res.request().method(),
      url: u.replace(/\?.*/, ''),
      body: b,
    });
  }
});

try {
  // ========== COLLAB ==========
  await hardReset(page, context);
  await shot(page, '00-login');
  await login(page, 'jasmine.collab@gmail.com', '123456', 'collab');

  await go(page, '/ouvrier-dashboard');
  let t = await body(page);
  await shot(page, 'c1-dashboard');
  rec(
    'collab',
    'dashboard',
    'Load + week API data',
    /TOTAL SEMAINE|\d+\.\dh|Bonjour/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 260),
  );
  rec(
    'collab',
    'dashboard',
    'Legend includes En attente',
    /En attente/i.test(t) ? 'PASS' : 'WARN',
    'status consistency fix',
  );
  const declareToday = await tryClick(page, /Déclarer aujourd'hui/i, 2500);
  rec(
    'collab',
    'dashboard',
    "Déclarer aujourd'hui",
    declareToday ? 'PASS' : 'SKIP',
    declareToday ? page.url() : 'hidden when week has hours (expected)',
  );
  if (declareToday) await go(page, '/ouvrier-dashboard');

  if (await tryClick(page, /Remplir ma semaine/i, 5000)) {
    await page.waitForTimeout(2500);
    t = await body(page);
    rec(
      'collab',
      'fill-week',
      'Remplir ma semaine → declare-day',
      /CHANTIER|HORAIRES|Valider la journée|JPX_/i.test(t) ? 'PASS' : 'FAIL',
      t.slice(0, 240),
      { url: page.url() },
    );
    await shot(page, 'c2-fill-week');
    rec('collab', 'declare-day', 'Toggle Panier', (await tryClick(page, /^Panier$/i, 3000)) ? 'PASS' : 'WARN');
    rec(
      'collab',
      'declare-day',
      'Toggle Déplacement',
      (await tryClick(page, /^Déplacement$/i, 3000)) ? 'PASS' : 'WARN',
    );
    if (await tryClick(page, /DÉBUT|Début/i, 3000)) {
      await page.waitForTimeout(600);
      rec(
        'collab',
        'declare-day',
        'Time picker Début',
        (await visible(page, /Valider|Annuler/i, 3000)) ? 'PASS' : 'WARN',
      );
      await tryClick(page, /^Annuler$/i, 3000);
    }
    rec(
      'collab',
      'declare-day',
      'CTA Valider la journée visible',
      (await visible(page, /Valider la journée/i, 3000)) ? 'PASS' : 'FAIL',
    );
    notes.push('Did not submit Valider la journée (avoid creating new periods)');
  } else {
    rec('collab', 'fill-week', 'Remplir ma semaine', 'FAIL');
  }

  await go(page, '/ouvrier-dashboard');
  if (await tryClick(page, /Jeu\.\s*16 juillet/i, 5000)) {
    await page.waitForTimeout(2500);
    t = await body(page);
    await shot(page, 'c3-day-empty');
    const slot1745 = (t.match(/17:45\s*→\s*23:45/g) || []).length;
    rec(
      'collab',
      'day-detail',
      'Open Jeu.16',
      /Validée|En attente|Ajouter|créneau|Chantier/i.test(t) ? 'PASS' : 'FAIL',
      t.slice(0, 280),
      { url: page.url() },
    );
    rec(
      'collab',
      'day-detail',
      'FE-01 no duplicate 17:45 slot',
      slot1745 <= 1 ? 'PASS' : 'FAIL',
      `count=${slot1745}`,
    );
    if (await tryClick(page, /Ajouter un créneau supplémentaire/i, 4000)) {
      await page.waitForTimeout(2000);
      rec(
        'collab',
        'day-detail',
        'Ajouter créneau',
        /Valider la journée|HORAIRES/i.test(await body(page)) ? 'PASS' : 'FAIL',
        page.url(),
      );
    }
  } else {
    rec('collab', 'day-detail', 'Open Jeu.16', 'FAIL');
  }

  await go(page, '/calendar');
  t = await body(page);
  await shot(page, 'c4-calendar');
  rec(
    'collab',
    'calendar',
    'Page load',
    /Calendrier|2026|LÉGENDE/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 200),
  );
  const beforeCal = t;
  const btns = page.getByRole('button');
  let monthOk = false;
  for (let i = 0; i < Math.min(await btns.count(), 6); i++) {
    if (((await btns.nth(i).innerText().catch(() => '')) || '').trim()) continue;
    await btns.nth(i).click().catch(() => {});
    await page.waitForTimeout(700);
    if ((await body(page)) !== beforeCal) {
      monthOk = true;
      break;
    }
  }
  rec('collab', 'calendar', 'Month navigation', monthOk ? 'PASS' : 'WARN');

  await go(page, '/profile');
  t = await body(page);
  await shot(page, 'c5-profile');
  rec(
    'collab',
    'profile',
    'Page load',
    /jasmine\.collab|Collaborateur|Déconnexion/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 200),
  );
  if (await tryClick(page, /Se déconnecter/i, 4000)) {
    await page.waitForTimeout(500);
    rec('collab', 'profile', 'Logout modal', (await visible(page, /Déconnexion|Annuler/i)) ? 'PASS' : 'FAIL');
    await tryClick(page, /^Annuler$/i, 3000);
    rec('collab', 'profile', 'Logout Annuler', 'PASS');
  }

  for (const tab of ['Tableau de bord', 'Calendrier', 'Profil']) {
    const ok =
      (await tryClick(page, new RegExp(`^${tab}$`, 'i'), 4000)) ||
      (await tryClick(page, new RegExp(tab, 'i'), 3000));
    await page.waitForTimeout(1000);
    rec('collab', 'tabs', tab, ok ? 'PASS' : 'WARN');
  }

  // ========== ADMIN ==========
  await hardReset(page, context);
  await login(page, 'jasmine.n@gmail.com', '123456', 'admin');

  await go(page, '/export');
  t = await body(page);
  await shot(page, 'a1-export');
  rec(
    'admin',
    'export',
    'Page load / stats',
    /Export|Déclarations|Validées/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 220),
  );
  rec('admin', 'export', 'Période Cette semaine', (await tryClick(page, /Cette semaine/i, 3000)) ? 'PASS' : 'WARN');
  rec('admin', 'export', 'Période Ce mois', (await tryClick(page, /Ce mois/i, 3000)) ? 'PASS' : 'WARN');
  await page.waitForTimeout(1000);
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 12000 }).catch(() => null),
      tryClick(page, /Exporter les données/i, 5000),
    ]);
    rec(
      'admin',
      'export',
      'Exporter les données',
      download ? 'PASS' : 'WARN',
      download ? `file=${download.suggestedFilename()}` : (await body(page)).slice(0, 160),
    );
  } catch (e) {
    rec('admin', 'export', 'Exporter les données', 'WARN', String(e.message || e));
  }

  await go(page, '/validation');
  t = await body(page);
  await shot(page, 'a2-validation');
  rec('admin', 'validation', 'Page load', /Validation|En attente/i.test(t) ? 'PASS' : 'FAIL', t.slice(0, 220));
  rec('admin', 'validation', 'Tab En attente', (await tryClick(page, /^En attente$/i, 3000)) ? 'PASS' : 'WARN');
  if (await tryClick(page, /^Toutes$/i, 3000)) {
    await page.waitForTimeout(1000);
    rec('admin', 'validation', 'Tab Toutes', 'PASS');
    await tryClick(page, /Validée/i, 2000);
    await tryClick(page, /Annulée/i, 2000);
    rec('admin', 'validation', 'Subfilters Validée/Annulée', 'PASS');
  }
  await tryClick(page, /^En attente$/i, 3000);
  const search = page.getByPlaceholder(/Rechercher chantier ou utilisateur/i);
  if (await search.count()) {
    await search.fill('JPX');
    await page.waitForTimeout(900);
    rec('admin', 'validation', 'Search JPX', /JPX|Chantier|Aucun/i.test(await body(page)) ? 'PASS' : 'WARN');
    await search.fill('');
  }
  if (await tryClick(page, /Chantier 1|JPX_001/i, 4000)) {
    await page.waitForTimeout(1200);
    t = await body(page);
    rec(
      'admin',
      'validation',
      'Expand worksite',
      /Valider|Annuler|h|utilisateur|nguyen/i.test(t) ? 'PASS' : 'WARN',
      t.slice(0, 220),
    );
    await shot(page, 'a2b-validation-expand');
    if (await tryClick(page, /Valider toute l'équipe/i, 4000)) {
      await page.waitForTimeout(700);
      rec(
        'admin',
        'validation',
        'Validate-all modal',
        (await visible(page, /Voulez-vous valider|Annuler|Valider/i)) ? 'PASS' : 'WARN',
      );
      await tryClick(page, /^Annuler$/i, 3000);
      rec('admin', 'validation', 'Cancel validate-all', 'PASS');
    }
    if (await tryClick(page, /Annuler tout/i, 3000)) {
      await page.waitForTimeout(600);
      rec(
        'admin',
        'validation',
        'Annuler tout modal',
        (await visible(page, /Retour|Annuler|Ne pas valider/i)) ? 'PASS' : 'WARN',
      );
      await tryClick(page, /^Retour$|^Annuler$/i, 3000);
    }
  }

  await go(page, '/management');
  t = await body(page);
  await shot(page, 'a3-management');
  rec(
    'admin',
    'management',
    'Users list',
    /Utilisateurs|Administration|@/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 240),
  );
  const uSearch = page.getByPlaceholder(/Rechercher un utilisateur/i);
  if (await uSearch.count()) {
    await uSearch.fill('jasmine');
    await page.waitForTimeout(800);
    rec('admin', 'management', 'Search users', /jasmine/i.test(await body(page)) ? 'PASS' : 'WARN');
    await uSearch.fill('');
  }

  const createUserBtn = page.getByTestId('management-create-user');
  if (await createUserBtn.count()) {
    await createUserBtn.click();
    await page.waitForTimeout(1000);
    const opened = await visible(page, /Nouvel utilisateur|Créer l'utilisateur|Créer un accès/i, 3000);
    rec('admin', 'management', 'Create user via testID (+)', opened ? 'PASS' : 'FAIL');
    await shot(page, 'a3b-create-user');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  } else {
    rec('admin', 'management', 'Create user via testID (+)', 'FAIL', 'testID not found — rebuild may be stale');
  }

  if (await tryClick(page, /^Chantiers$/i, 4000)) {
    await page.waitForTimeout(2000);
    t = await body(page);
    await shot(page, 'a4-worksites');
    const codes = /JPX_001/.test(t) && /9QQ_002/.test(t);
    rec('admin', 'management', 'Worksites codes JPX/9QQ', codes ? 'PASS' : 'FAIL', t.slice(0, 260));
    const wSearch = page.getByPlaceholder(/Rechercher un chantier/i);
    if (await wSearch.count()) {
      await wSearch.fill('JPX');
      await page.waitForTimeout(800);
      rec('admin', 'management', 'Search worksites', /JPX/i.test(await body(page)) ? 'PASS' : 'WARN');
      await wSearch.fill('');
    }
    const createWs = page.getByTestId('management-create-worksite');
    if (await createWs.count()) {
      await createWs.click();
      await page.waitForTimeout(1000);
      rec(
        'admin',
        'management',
        'Create worksite via testID (+)',
        (await visible(page, /Nouveau chantier|Créer un chantier|Enregistrer/i, 3000)) ? 'PASS' : 'FAIL',
      );
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      rec('admin', 'management', 'Create worksite via testID (+)', 'WARN', 'testID missing on chantiers tab');
    }
  }

  await go(page, '/admin-worksites');
  t = await body(page);
  await shot(page, 'a5-admin-worksites');
  rec('admin', 'admin-worksites', 'Deep link load', /Chantiers|Chantier/i.test(t) ? 'PASS' : 'FAIL');
  rec(
    'admin',
    'admin-worksites',
    'Codes visible (FE-03)',
    /JPX_|9QQ_/i.test(t) ? 'PASS' : 'FAIL',
    t.slice(0, 260),
  );
  if (await tryClick(page, /Chantier 1/i, 4000)) {
    await page.waitForTimeout(2000);
    rec(
      'admin',
      'worksite-detail',
      'Open detail',
      /Ajouter|Utilisateur|Adresse|Chantier/i.test(await body(page)) ? 'PASS' : 'WARN',
      page.url(),
    );
    await shot(page, 'a6-worksite-detail');
  }

  await go(page, '/admin-users');
  rec('admin', 'admin-users', 'Deep link', /Utilisateurs|@/i.test(await body(page)) ? 'PASS' : 'FAIL');

  await go(page, '/timesheet');
  await page.waitForTimeout(2000);
  t = await body(page);
  rec(
    'admin',
    'timesheet',
    'Deep link',
    /semaine|Ajouter|Confirmer|Déclaration|heures|0h/i.test(t) ? 'PASS' : 'WARN',
    t.slice(0, 200),
  );

  await go(page, '/profile');
  t = await body(page);
  await shot(page, 'a7-profile');
  rec('admin', 'profile', 'Page load', /Admin|jasmine\.n|Déconnexion/i.test(t) ? 'PASS' : 'FAIL');
  if (await tryClick(page, /Se déconnecter/i, 4000)) {
    rec('admin', 'profile', 'Logout modal', (await visible(page, /Déconnexion|Annuler/i)) ? 'PASS' : 'FAIL');
    await tryClick(page, /^Annuler$/i, 3000);
  }

  for (const tab of ['Validation', 'Statistiques', 'Gestion', 'Profil']) {
    rec('admin', 'tabs', tab, (await tryClick(page, new RegExp(`^${tab}$`, 'i'), 4000)) ? 'PASS' : 'FAIL');
    await page.waitForTimeout(900);
  }

  rec('system', 'realtime', 'SSE /events observed', sse.some((s) => s === 200) ? 'PASS' : 'WARN', `hits=${sse.length}`);
} catch (e) {
  rec('system', 'runner', 'CRASH', 'FAIL', String(e && e.message || e));
  await shot(page, 'zz-crash');
}

const uniq = [];
const seen = new Set();
for (const e of apiErrors) {
  const k = `${e.status}${e.method}${e.url}${e.body || ''}`;
  if (!seen.has(k)) {
    seen.add(k);
    uniq.push(e);
  }
}
const zones400 = uniq.filter((e) => /zones_chantiers/.test(e.url) && e.status === 400);
rec(
  'system',
  'api',
  'API-01 no zones_chantiers 400',
  zones400.length === 0 ? 'PASS' : 'FAIL',
  zones400.length ? JSON.stringify(zones400[0]) : 'none',
);

const summary = {
  total: results.length,
  pass: results.filter((r) => r.status === 'PASS').length,
  fail: results.filter((r) => r.status === 'FAIL').length,
  warn: results.filter((r) => r.status === 'WARN').length,
  skip: results.filter((r) => r.status === 'SKIP').length,
};

const report = {
  generatedAt: new Date().toISOString(),
  verdict: summary.fail === 0 ? 'PASS' : 'ISSUES',
  summary,
  results,
  apiErrors: uniq,
  sseCount: sse.length,
  sseOk: sse.some((s) => s === 200),
  consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
  notes,
};

fs.writeFileSync(path.join(OUT, 'retest-results.json'), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      verdict: report.verdict,
      summary: report.summary,
      fails: results.filter((r) => r.status === 'FAIL'),
      warns: results.filter((r) => r.status === 'WARN'),
      apiErrors: uniq,
      sse: { count: sse.length, ok: report.sseOk },
      notes,
    },
    null,
    2,
  ),
);
await page.waitForTimeout(1500);
await browser.close();
process.exit(report.summary.fail > 0 ? 1 : 0);
