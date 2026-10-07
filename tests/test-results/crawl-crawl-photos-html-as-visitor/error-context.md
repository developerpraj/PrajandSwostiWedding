# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crawl.spec.js >> crawl photos.html as visitor
- Location: e2e\crawl.spec.js:73:3

# Error details

```
Error: uncaught page errors

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   "Unexpected token 'catch'",
+   "Unexpected token 'catch'",
+   "Unexpected token 'catch'",
+   "Unexpected token 'catch'",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f4e1]:
  - banner [ref=f4e2]:
    - generic [ref=f4e3]: 🪔 शुभविवाह
    - navigation [ref=f4e4]:
      - link "Home" [ref=f4e5] [cursor=pointer]:
        - /url: index.html
      - link "Photos" [ref=f4e6] [cursor=pointer]:
        - /url: photos.html
      - link "Games" [ref=f4e7] [cursor=pointer]:
        - /url: games.html
      - link "Gift" [ref=f4e8] [cursor=pointer]:
        - /url: gift.html
      - link "My Pass" [ref=f4e9] [cursor=pointer]:
        - /url: pass.html
      - link "In Memory of Mom" [ref=f4e10] [cursor=pointer]:
        - /url: memorial.html
  - main [ref=f4e12]:
    - generic [ref=f4e13]:
      - generic [ref=f4e14]:
        - heading "Everyone's photos" [level=2] [ref=f4e15]
        - generic [ref=f4e16]:
          - generic [ref=f4e17] [cursor=pointer]: All
          - generic [ref=f4e18] [cursor=pointer]: Mine
      - generic [ref=f4e19]:
        - generic [ref=f4e20]:
          - generic [ref=f4e21] [cursor=pointer]: All
          - generic [ref=f4e22] [cursor=pointer]: 📷 Photos
          - generic [ref=f4e23] [cursor=pointer]: 🎬 Videos
        - combobox "Event" [ref=f4e24]:
          - option "All events" [selected]
        - combobox "Side" [ref=f4e25]:
          - option "Both sides" [selected]
        - generic [ref=f4e26]:
          - generic [ref=f4e27] [cursor=pointer]: ▦ Grid
          - generic [ref=f4e28] [cursor=pointer]: ☰ Feed
        - link "▶ Slideshow" [ref=f4e29] [cursor=pointer]:
          - /url: slideshow.html
  - generic [ref=f4e31]:
    - text: 🧪 Demo data - not connected to Google Drive
    - button "Reset" [ref=f4e32] [cursor=pointer]
  - alert [ref=f4e33]:
    - text: "Something went wrong. (Uncaught SyntaxError: Unexpected token 'catch')"
    - button "Reload" [ref=f4e34] [cursor=pointer]
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