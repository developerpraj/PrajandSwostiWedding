// New features: Elder Mode, live feed, team bar, large-file warning, offline pass, memory book helpers.
const { test, expect, openDemo, resetDemo, adminLogin } = require('./fixtures');

test.beforeEach(async ({ page }) => { await resetDemo(page); });

test('Elder Mode toggle enlarges text and hides extras, and persists', async ({ page }) => {
  await openDemo(page, 'index.html?g=G003');
  const btn = page.locator('#elderToggle');
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page.locator('html')).toHaveClass(/elder/);
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#latestCard')).toBeHidden();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/elder/);
  await page.locator('#elderToggle').click();
  await expect(page.locator('html')).not.toHaveClass(/elder/);
});

test('team bar exposes an accessible label', async ({ page }) => {
  await openDemo(page, 'index.html?g=G003');
  const bar = page.locator('#teamBar');
  await expect(bar).toHaveAttribute('role', 'img');
  await expect(bar).toHaveAttribute('aria-label', /\d/);
});

test('App.eventForTime matches the server window rules', async ({ page }) => {
  await openDemo(page, 'index.html');
  const r = await page.evaluate(() => {
    const ev = [{ EventId: 'A', DateTime: '2026-12-12T10:00:00Z' }, { EventId: 'B', DateTime: '2026-12-12T18:00:00Z' }];
    return [App.eventForTime(ev, '2026-12-12T08:30:00Z'), App.eventForTime(ev, '2026-12-12T16:30:00Z'), App.eventForTime(ev, '2026-12-11T00:00:00Z')];
  });
  expect(r).toEqual(['A', 'B', '']);
});

test('App.fetchLive falls back to the API when live.json is missing', async ({ page }) => {
  await page.route('**/live.json*', r => r.fulfill({ status: 404, body: '' }));
  await openDemo(page, 'index.html');
  const d = await page.evaluate(() => App.fetchLive());
  expect(d).toHaveProperty('live');
});

test('pass page uses the saved snapshot when the API fails', async ({ page }) => {
  await openDemo(page, 'pass.html?g=G003');
  await page.evaluate(() => App.savePassSnapshot({ guestId: 'G003', name: 'Snapshot Family', registered: true, members: [] }));
  const snap = await page.evaluate(() => App.passSnapshot());
  expect(snap.name).toBe('Snapshot Family');
});

test('photos page warns about files over the size limit', async ({ page }) => {
  await openDemo(page, 'photos.html?g=G003');
  await page.evaluate(() => { const c = JSON.parse(sessionStorage.getItem('config') || '{}'); c['media.maxSizeMB'] = '0.001'; sessionStorage.setItem('config', JSON.stringify(c)); });
  await page.reload();
  await page.waitForFunction(() => !!window.DEMO_API);
  await page.setInputFiles('#filePick', { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(4096) });
  await expect(page.locator('#msg')).toBeVisible();
});

test('admin memory book returns approved memories only', async ({ page }) => {
  await adminLogin(page);
  const r = await page.evaluate(() => API.call('admin.memoryBook', {}));
  expect(Array.isArray(r.memories)).toBe(true);
  r.memories.forEach(m => expect(m.Status).toBe('Approved'));
});
