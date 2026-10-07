# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios.spec.js >> feature flags off keep pages error-free
- Location: e2e\scenarios.spec.js:116:1

# Error details

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

# Page snapshot

```yaml
- generic [active] [ref=f8e1]:
  - banner [ref=f8e2]:
    - generic [ref=f8e3]: 🪔 शुभविवाह
    - navigation [ref=f8e4]:
      - link "गृहपृष्ठ · Home" [ref=f8e5] [cursor=pointer]:
        - /url: index.html?g=G001
        - generic [ref=f8e6]: गृहपृष्ठ
        - generic [ref=f8e7]: ·
        - generic [ref=f8e8]: Home
      - link "विधि · Ceremony" [ref=f8e9] [cursor=pointer]:
        - /url: ceremony.html?g=G001
        - generic [ref=f8e10]: विधि
        - generic [ref=f8e11]: ·
        - generic [ref=f8e12]: Ceremony
      - link "फोटो · Photos" [ref=f8e13] [cursor=pointer]:
        - /url: photos.html?g=G001
        - generic [ref=f8e14]: फोटो
        - generic [ref=f8e15]: ·
        - generic [ref=f8e16]: Photos
      - link "nav.gift" [ref=f8e17] [cursor=pointer]:
        - /url: gift.html?g=G001
      - link "मेरो पास · My Pass" [ref=f8e18] [cursor=pointer]:
        - /url: pass.html?g=G001
        - generic [ref=f8e19]: मेरो पास
        - generic [ref=f8e20]: ·
        - generic [ref=f8e21]: My Pass
    - generic [ref=f8e22]:
      - button "English" [ref=f8e23] [cursor=pointer]
      - button "नेपाली" [ref=f8e24] [cursor=pointer]
      - button "Nepanglish" [ref=f8e25] [cursor=pointer]
    - button "ठूलो अक्षर, सजिलो पेज · Bigger text, simpler screen" [ref=f8e26] [cursor=pointer]: A+
  - 'link "📝 आफ्नो उपस्थिति पुष्टि गर्नुहोस् · Demo: finish your RSVP - it takes 1 minute › close" [ref=f8e27] [cursor=pointer]':
    - /url: register.html?g=G001
    - generic [ref=f8e28]: 📝
    - generic [ref=f8e29]: "आफ्नो उपस्थिति पुष्टि गर्नुहोस् · Demo: finish your RSVP - it takes 1 minute"
    - generic [ref=f8e30]: ›
    - button "close" [ref=f8e31]: ×
  - generic [ref=f8e32]:
    - generic [ref=f8e33]: स्वागत छ · Welcome, Hari!
    - 'button "Hari होइन? आफ्नै पास खोज्नुहोस् · Not {name}? Find your own pass" [ref=f8e34] [cursor=pointer]'
  - main [ref=f8e35]:
    - generic [ref=f8e36]:
      - paragraph [ref=f8e37]: ॥ विवाह संस्कार ॥
      - heading "विवाह विधि · Ceremony guide" [level=1] [ref=f8e38]
      - paragraph [ref=f8e39]: अहिले भइरहेको विधि माथि देखिन्छ। · Follow along — the ritual happening now rises to the top.
    - generic [ref=f8e40]: केही समस्या भयो · Something went wrong
    - list
  - generic [ref=f8e41]:
    - text: 🧪 Demo data - not connected to Google Drive
    - button "Reset" [ref=f8e42] [cursor=pointer]
  - generic [ref=f8e43]:
    - text: बिहे योजनामा सहयोगका लागि यो एपले तपाईंको गतिविधि रेकर्ड गर्छ। · This app records your activity to help plan the wedding.
    - button "ठीक छ · OK" [ref=f8e44] [cursor=pointer]
  - status [ref=f8e45]: केही समस्या भयो · Something went wrong
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