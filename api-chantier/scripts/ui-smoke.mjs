/**
 * UI smoke test: login ouvrier + click Declare today / day row.
 * Usage: node scripts/ui-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.WEB_URL || 'http://localhost:16035';
const EMAIL = process.env.OUV_EMAIL || 'jasmine.collab@gmail.com';
const PASS = process.env.OUV_PASS || '123456';

async function clickText(page, re, timeout = 15000) {
  const loc = page.getByText(re).first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.click({ timeout });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const results = [];

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Login
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  await emailInput.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await clickText(page, /se connecter|sign in|login/i);
  await page.waitForTimeout(4000);

  const afterLogin = await page.locator('body').innerText();
  const loggedIn = /bonjour|hello|déclar|declare|jours|days of the week/i.test(afterLogin);
  results.push({ step: 'login', ok: loggedIn, url: page.url() });

  // Wait for week data (hours should appear after date fix)
  await page.waitForTimeout(2500);
  const dashText = await page.locator('body').innerText();
  const hourMatches = dashText.match(/\d+h\d{2}/g) || [];
  const nonZeroHours = hourMatches.filter((h) => h !== '0h00');
  results.push({
    step: 'dashboard_shows_week_data',
    ok: nonZeroHours.length > 0,
    hours: hourMatches.slice(0, 8),
    snippet: dashText.replace(/\s+/g, ' ').slice(0, 350),
  });

  // Declare today
  try {
    await clickText(page, /déclarer aujourd|declare today/i);
    await page.waitForTimeout(3000);
    const t = await page.locator('body').innerText();
    const moved =
      /horaires|chantier|worksite|valider|suggestion|panier|meal|confirmer/i.test(t) ||
      /declare|choose|suggestion/i.test(page.url());
    results.push({ step: 'declare_today_navigates', ok: moved, url: page.url() });
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
  } catch (e) {
    results.push({ step: 'declare_today_navigates', ok: false, error: String(e.message || e) });
  }

  // Day row Thu 16
  try {
    await clickText(page, /jeu\.\s*16|16 juillet|thu\.?\s*16/i);
    await page.waitForTimeout(3000);
    const t = await page.locator('body').innerText();
    const moved =
      /horaires|valider|panier|meal|suggestion|ligne|period/i.test(t) ||
      /declare|empty|suggestion|choose/i.test(page.url());
    results.push({ step: 'day_row_navigates', ok: moved, url: page.url() });
  } catch (e) {
    results.push({ step: 'day_row_navigates', ok: false, error: String(e.message || e) });
  }

  // Fill my week
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    // ensure on dashboard
    if (await page.locator('input[type="email"]').count()) {
      await page.locator('input[type="email"]').fill(EMAIL);
      await page.locator('input[type="password"]').fill(PASS);
      await clickText(page, /se connecter|sign in/i);
      await page.waitForTimeout(3000);
    }
    await clickText(page, /remplir ma semaine|fill my week/i);
    await page.waitForTimeout(2500);
    const t = await page.locator('body').innerText();
    const reacted = /suggestion|reproduire|nouvelle semaine|valider|annuler|cancel/i.test(t);
    results.push({ step: 'fill_week_opens_flow', ok: reacted, snippet: t.replace(/\s+/g, ' ').slice(0, 250) });
  } catch (e) {
    results.push({ step: 'fill_week_opens_flow', ok: false, error: String(e.message || e) });
  }

  console.log(JSON.stringify({ results, consoleErrors: consoleErrors.slice(0, 15) }, null, 2));
  await browser.close();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
