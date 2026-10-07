// Crawls every page in demo mode as guest, visitor and admin: fills inputs and clicks visible controls.
// Fails (via fixtures) on any uncaught page error.
const { test, openDemo, resetDemo, adminLogin } = require('./fixtures');

const GUEST_PAGES = ['index.html', 'register.html', 'signin.html', 'photos.html', 'ceremony.html',
  'gift.html', 'games.html', 'pass.html', 'memorial.html', 'slideshow.html', 'whisper.html'];
const ADMIN_PAGES = ['admin/index.html', 'admin/planner.html', 'admin/nametags.html'];

async function fillAll(page) {
  const stop = Date.now() + 45000;
  const inputs = page.locator('input:visible, textarea:visible, select:visible');
  const n = Math.min(await inputs.count(), 60);
  for (let i = 0; i < n && Date.now() < stop; i++) {
    const el = inputs.nth(i);
    const tag = await el.evaluate(e => e.tagName.toLowerCase(), null, { timeout: 500 }).catch(() => '');
    const type = (await el.getAttribute('type', { timeout: 500 }).catch(() => '')) || '';
    try {
      if (tag === 'select') {
        if (await el.locator('option').count() > 1) await el.selectOption({ index: 1 }, { timeout: 500 });
      } else if (['checkbox', 'radio'].includes(type)) {
        await el.check({ timeout: 500 });
      } else if (['file', 'hidden', 'submit', 'button', 'color', 'range'].includes(type)) {
        continue;
      } else if (type === 'number') {
        await el.fill('2', { timeout: 500 });
      } else if (type === 'date') {
        await el.fill('2030-01-01', { timeout: 500 });
      } else if (type === 'tel') {
        await el.fill('5551234567', { timeout: 500 });
      } else if (type === 'email') {
        await el.fill('test@example.com', { timeout: 500 });
      } else {
        await el.fill('Test', { timeout: 500 });
      }
    } catch { /* detached or not editable */ }
  }
}

async function clickAll(page, startUrl) {
  const stop = Date.now() + 90000;
  const sel = 'button:visible, [role="tab"]:visible, a[href^="#"]:visible';
  const n = Math.min(await page.locator(sel).count(), 80);
  for (let i = 0; i < n && Date.now() < stop; i++) {
    const b = page.locator(sel).nth(i);
    if (!(await b.isVisible({ timeout: 500 }).catch(() => false))) continue;
    await b.click({ timeout: 1000, noWaitAfter: true }).catch(() => {});
    await page.waitForTimeout(50);
    if (!page.url().includes(startUrl.split('?')[0])) {
      await page.goBack().catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
    }
  }
}

async function crawl(page, url, passes = 2) {
  page.context().on('page', p => p.close().catch(() => {}));
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  for (let pass = 0; pass < passes; pass++) {
    await fillAll(page);
    await clickAll(page, url);
  }
}

test.describe.configure({ timeout: 120000 });

for (const p of GUEST_PAGES) {
  test(`crawl ${p} as guest`, async ({ page }) => {
    await resetDemo(page);
    await openDemo(page, p);
    await crawl(page, p);
  });

  test(`crawl ${p} as visitor`, async ({ page }) => {
    await resetDemo(page);
    await openDemo(page, p);
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) if (/guest|session/i.test(k)) localStorage.removeItem(k);
    });
    await page.reload();
    await page.waitForFunction(() => !!window.DEMO_API);
    await crawl(page, p);
  });
}

for (const p of ADMIN_PAGES) {
  test(`crawl ${p} as admin`, async ({ page }) => {
    test.setTimeout(300000);
    await resetDemo(page);
    await adminLogin(page, p);
    await crawl(page, p, 1);
  });
}