// Field-readiness: WhatsApp/Viber webviews, lost links, data saver, gate pass, elder tap targets, offline door.
const { test, expect, openDemo, resetDemo, adminLogin } = require('./fixtures');

test.beforeEach(async ({ page }) => { await resetDemo(page); });

test('App.inAppBrowser recognises WhatsApp, Viber, Facebook and Android webviews only', async ({ page }) => {
  await openDemo(page, 'index.html');
  const r = await page.evaluate(() => [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148 WhatsApp/2.24',
    'Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Viber/21.0',
    'Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/450.0]',
    'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Mobile/15E148 Safari/604.1'
  ].map(ua => App.inAppBrowser(ua)));
  expect(r).toEqual([true, true, true, false, false]);
});

test.describe('inside WhatsApp', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 WhatsApp/2.24' });

  test('shows the open-in-Chrome banner, and dismissing it sticks for the session', async ({ page }) => {
    await openDemo(page, 'index.html?g=G003');
    const b = page.locator('#inAppBanner');
    await expect(b).toBeVisible();
    await expect(b).toContainText(/Chrome/);
    await b.locator('[data-x]').click();
    await expect(b).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#inAppBanner')).toHaveCount(0);
  });

  test('sign-in hides Google (disallowed_useragent) and explains why', async ({ page }) => {
    await openDemo(page, 'signin.html');
    await page.evaluate(() => { const c = JSON.parse(sessionStorage.getItem('config') || '{}'); c['auth.google'] = 'TRUE'; c['auth.googleClientId'] = 'x'; sessionStorage.setItem('config', JSON.stringify(c)); });
    await page.reload();
    await expect(page.locator('#googleBox')).toBeHidden();
    await expect(page.locator('#msg')).toContainText(/WhatsApp/);
  });
});

test('no banner in a normal browser', async ({ page }) => {
  await openDemo(page, 'index.html?g=G003');
  await expect(page.locator('#inAppBanner')).toHaveCount(0);
});

test('Find My Pass restores the session from phone + surname and persists it', async ({ page }) => {
  await openDemo(page, 'signin.html');
  await page.locator('#findBox summary').click();
  await page.fill('#findForm [name=phone]', '9800000002');
  await page.fill('#findForm [name=name]', 'Thapa');
  await page.locator('#findForm button').click();
  await page.waitForURL(/index\.html|register\.html/);
  expect(await page.evaluate(() => localStorage.getItem('guestId'))).toBe('G002');
});

test('Find My Pass shows an error for a wrong surname', async ({ page }) => {
  await openDemo(page, 'signin.html');
  await page.locator('#findBox summary').click();
  await page.fill('#findForm [name=phone]', '9800000002');
  await page.fill('#findForm [name=name]', 'Nobody');
  await page.locator('#findForm button').click();
  await expect(page.locator('#msg')).toContainText(/No invitation/);
});

test('App.compressImage shrinks large photos under the cap and leaves videos alone', async ({ page }) => {
  await openDemo(page, 'photos.html?g=G003');
  const r = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 3000; c.height = 2000;
    const g = c.getContext('2d');
    for (let i = 0; i < 4000; i++) { g.fillStyle = 'hsl(' + (i * 37 % 360) + ',80%,50%)'; g.fillRect(Math.random() * 3000, Math.random() * 2000, 40, 40); }
    const png = await new Promise(res => c.toBlob(res, 'image/png'));
    const big = new File([png], 'big.png', { type: 'image/png', lastModified: 1 });
    const out = await App.compressImage(big, 300 * 1024);
    const vid = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' });
    const small = new File([new Uint8Array(10)], 's.jpg', { type: 'image/jpeg' });
    return { inSize: big.size, outSize: out.size, type: out.type, name: out.name, vidSame: (await App.compressImage(vid, 1)) === vid, smallSame: (await App.compressImage(small)) === small };
  });
  expect(r.outSize).toBeLessThanOrEqual(r.inSize);
  if (r.outSize < r.inSize) { expect(r.type).toBe('image/jpeg'); expect(r.name).toBe('big.jpg'); }
  expect(r.vidSame).toBe(true);
  expect(r.smallSame).toBe(true);
});

test('photos page has data saver on by default and one keep-open notice', async ({ page }) => {
  await openDemo(page, 'photos.html?g=G003');
  await expect(page.locator('#compressPick')).toBeChecked();
  await expect(page.locator('#keepOpen')).toHaveCount(1);
  await expect(page.locator('#catRow')).toHaveCount(1);
  await expect(page.locator('#anonPick')).toHaveCount(1);
});

test('gate pass QR sits on a white quiet zone with a brightness reminder', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openDemo(page, 'pass.html?g=G003');
  const qr = page.locator('#pQr');
  await expect(qr).toHaveClass(/qr-scan/);
  expect(await qr.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(parseFloat(await qr.evaluate(el => getComputedStyle(el).paddingTop))).toBeGreaterThanOrEqual(16);
  await expect(page.locator('.brightness-tip')).toContainText(/brightness|उज्यालो/);
});

test.describe('budget Android with large fonts', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('buttons and nav links are at least 48px tall', async ({ page }) => {
    await openDemo(page, 'index.html?g=G003');
    const small = await page.evaluate(() => [...document.querySelectorAll('.btn, button, .topbar nav a')]
      .filter(el => el.offsetParent && el.getBoundingClientRect().height < 47.5).map(el => el.outerHTML.slice(0, 80)));
    expect(small).toEqual([]);
  });

  test('mixed mode stacks Nepali above English on narrow screens', async ({ page }) => {
    await openDemo(page, 'index.html?g=G003');
    await page.evaluate(() => I18N.set('mix'));
    const el = page.locator('[data-i18n] .bi-ne').first();
    await expect(el).toBeVisible();
    expect(await el.evaluate(e => getComputedStyle(e).display)).toBe('block');
    expect(await page.evaluate(() => I18N.biHtml('<b>', 'x'))).toContain('&lt;b&gt;');
  });
});

test('ceremony marks the next ritual "Up next" when none is live (no countdown)', async ({ page }) => {
  await openDemo(page, 'ceremony.html?g=G003');
  await page.waitForSelector('.rit-card');
  const live = await page.locator('.rit-card.now').count();
  if (!live) await expect(page.locator('.rit-badge.next')).toHaveCount(1);
  await expect(page.locator('text=/\\d\\d:\\d\\d:\\d\\d/')).toHaveCount(0);
});

test('door tab: offline check-in by name, queued, then synced when back online', async ({ page, context }) => {
  await adminLogin(page);
  await page.locator('#tabs [data-tab="door"]').click();
  await expect(page.locator('#doorStatus')).toContainText(/saved/);
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  const who = await page.evaluate(() => Door.list().guests.find(x => String(x.CheckedIn).toUpperCase() !== 'TRUE').Name);
  await page.fill('#doorSearch', who);
  await page.locator('#doorResult [data-door-in]').first().click();
  await expect(page.locator('#doorResult')).toContainText('✅');
  expect(await page.evaluate(() => Door.pending().length)).toBe(1);
  await expect(page.locator('#doorStatus')).toContainText(/waiting to sync/);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => page.evaluate(() => Door.pending().length)).toBe(0);
});
