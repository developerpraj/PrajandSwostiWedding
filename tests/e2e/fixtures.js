// Shared Playwright fixtures: collects JS coverage for every test, fails on uncaught page errors,
// and offers helpers for demo mode, seeded data (tests/seed.json) and admin login.
const fs = require('fs');
const path = require('path');
const base = require('@playwright/test');
const MCR = require('monocart-coverage-reports');
const coverageOptions = require('../coverage.config.js');

const SEED_FILE = path.join(__dirname, '..', 'seed.json');
const loadSeed = () => fs.existsSync(SEED_FILE) ? fs.readFileSync(SEED_FILE, 'utf8') : null;

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    const cov = await page.coverage.stopJSCoverage();
    await MCR(coverageOptions).add(cov);
    if (!testInfo.annotations.some(a => a.type === 'allow-errors')) {
      base.expect(errors, 'uncaught page errors').toEqual([]);
    }
  }
});

// Seed localStorage.demoDB once per tab (before any app script runs) so demo-api.js starts from tests/seed.json.
// opts.guestId signs that guest in; opts.admin = 'owner' | 'helper' prepares an admin session.
async function seedPage(page, opts) {
  opts = opts || {};
  await page.addInitScript(({ seed, guestId, admin }) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.clear();
    localStorage.setItem('appMode', 'demo');
    if (seed) localStorage.setItem('demoDB', seed);
    if (guestId) localStorage.setItem('guestId', guestId);
    if (admin) {
      sessionStorage.setItem('adminKey', 'demo');
      if (admin === 'helper') sessionStorage.setItem('demoRole', 'helper');
    }
  }, { seed: loadSeed(), guestId: opts.guestId || '', admin: opts.admin || '' });
}

// Passing opts seeds tests/seed.json; without opts the built-in demo data is used (older specs rely on it).
async function openDemo(page, url, opts) {
  if (opts && !page.__seeded) { page.__seeded = true; await seedPage(page, opts); }
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'mode=demo');
  await page.waitForFunction(() => !!window.DEMO_API);
}

async function resetDemo(page) {
  await page.goto('index.html?mode=demo');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('appMode', 'demo'); });
}

async function adminLogin(page, url) {
  await openDemo(page, url || 'admin/index.html');
  await page.evaluate(() => sessionStorage.setItem('adminKey', 'demo'));
  await page.reload();
  await page.waitForFunction(() => !!window.DEMO_API);
}

module.exports = { test, expect: base.expect, openDemo, resetDemo, adminLogin, seedPage, loadSeed };
