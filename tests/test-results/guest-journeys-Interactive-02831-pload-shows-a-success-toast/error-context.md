# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guest-journeys.spec.js >> Interactive features >> photo upload shows a success toast
- Location: e2e\guest-journeys.spec.js:121:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#appToast')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#appToast') with timeout 10000ms
  - waiting for locator('#appToast')

```

```yaml
- banner:
  - text: 🪔 शुभविवाह
  - navigation:
    - link "Home":
      - /url: index.html
    - link "Photos":
      - /url: photos.html
    - link "Games":
      - /url: games.html
    - link "Gift":
      - /url: gift.html
    - link "My Pass":
      - /url: pass.html
    - link "In Memory of Mom":
      - /url: memorial.html
- main:
  - heading "Everyone's photos" [level=2]
  - text: All Mine All 📷 Photos 🎬 Videos
  - combobox "Event":
    - option "All events" [selected]
  - combobox "Side":
    - option "Both sides" [selected]
  - text: ▦ Grid ☰ Feed
  - link "▶ Slideshow":
    - /url: slideshow.html
- text: 🧪 Demo data - not connected to Google Drive
- button "Reset"
- alert:
  - text: "Something went wrong. (Uncaught SyntaxError: Unexpected token 'catch')"
  - button "Reload"
```

```
Error: uncaught page errors

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Unexpected token 'catch'",
+ ]
```

# Test source

```ts
  1  | // Shared Playwright fixtures: collects JS coverage for every test, fails on uncaught page errors,
  2  | // and offers helpers for demo mode, seeded data (tests/seed.json) and admin login.
  3  | const fs = require('fs');
  4  | const path = require('path');
  5  | const base = require('@playwright/test');
  6  | const MCR = require('monocart-coverage-reports');
  7  | const coverageOptions = require('../coverage.config.js');
  8  | 
  9  | const SEED_FILE = path.join(__dirname, '..', 'seed.json');
  10 | const loadSeed = () => fs.existsSync(SEED_FILE) ? fs.readFileSync(SEED_FILE, 'utf8') : null;
  11 | 
  12 | const test = base.test.extend({
  13 |   page: async ({ page }, use, testInfo) => {
  14 |     const errors = [];
  15 |     page.on('pageerror', e => errors.push(e.message));
  16 |     page.on('dialog', d => d.accept());
  17 |     await page.coverage.startJSCoverage({ resetOnNavigation: false });
  18 |     await use(page);
  19 |     const cov = await page.coverage.stopJSCoverage();
  20 |     await MCR(coverageOptions).add(cov);
  21 |     if (!testInfo.annotations.some(a => a.type === 'allow-errors')) {
> 22 |       base.expect(errors, 'uncaught page errors').toEqual([]);
     |                                                   ^ Error: uncaught page errors
  23 |     }
  24 |   }
  25 | });
  26 | 
  27 | // Seed localStorage.demoDB once per tab (before any app script runs) so demo-api.js starts from tests/seed.json.
  28 | // opts.guestId signs that guest in; opts.admin = 'owner' | 'helper' prepares an admin session.
  29 | async function seedPage(page, opts) {
  30 |   opts = opts || {};
  31 |   await page.addInitScript(({ seed, guestId, admin }) => {
  32 |     if (sessionStorage.getItem('__seeded')) return;
  33 |     sessionStorage.setItem('__seeded', '1');
  34 |     localStorage.clear();
  35 |     localStorage.setItem('appMode', 'demo');
  36 |     if (seed) localStorage.setItem('demoDB', seed);
  37 |     if (guestId) localStorage.setItem('guestId', guestId);
  38 |     if (admin) {
  39 |       sessionStorage.setItem('adminKey', 'demo');
  40 |       if (admin === 'helper') sessionStorage.setItem('demoRole', 'helper');
  41 |     }
  42 |   }, { seed: loadSeed(), guestId: opts.guestId || '', admin: opts.admin || '' });
  43 | }
  44 | 
  45 | // Passing opts seeds tests/seed.json; without opts the built-in demo data is used (older specs rely on it).
  46 | async function openDemo(page, url, opts) {
  47 |   if (opts && !page.__seeded) { page.__seeded = true; await seedPage(page, opts); }
  48 |   await page.goto(url + (url.includes('?') ? '&' : '?') + 'mode=demo');
  49 |   await page.waitForFunction(() => !!window.DEMO_API);
  50 | }
  51 | 
  52 | async function resetDemo(page) {
  53 |   await page.goto('index.html?mode=demo');
  54 |   await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('appMode', 'demo'); });
  55 | }
  56 | 
  57 | async function adminLogin(page, url) {
  58 |   await openDemo(page, url || 'admin/index.html');
  59 |   await page.evaluate(() => sessionStorage.setItem('adminKey', 'demo'));
  60 |   await page.reload();
  61 |   await page.waitForFunction(() => !!window.DEMO_API);
  62 | }
  63 | 
  64 | module.exports = { test, expect: base.expect, openDemo, resetDemo, adminLogin, seedPage, loadSeed };
  65 | 
```