// Admin journeys against the seeded demo database: RBAC, Salami ledger, offline door check-in.
const { test, expect, openDemo } = require('./fixtures');

async function spyApi(page) {
  await page.addInitScript(() => {
    window.__calls = [];
    const t = setInterval(() => {
      if (!window.DEMO_API || window.DEMO_API.__spied) return;
      const h = window.DEMO_API.handle;
      window.DEMO_API.handle = function (a, d) { window.__calls.push({ a: a, d: d || {} }); return h.call(this, a, d); };
      window.DEMO_API.__spied = true; clearInterval(t);
    }, 1);
  });
}
const adminReady = page => expect(page.locator('#app')).toBeVisible();

test.describe('RBAC: Helper', () => {
  test('owner-only tabs are hidden and blocked', async ({ page }) => {
    test.info().annotations.push({ type: 'allow-errors' });
    await openDemo(page, 'admin/index.html', { admin: 'helper' });
    await adminReady(page);
    const settingsTab = page.locator('#tabs [data-tab="settings"]');
    const teamTab = page.locator('#tabs [data-tab="team"]');
    await expect(settingsTab).toBeHidden();
    await expect(teamTab).toBeHidden();
    // Force the click anyway: UI must refuse.
    await settingsTab.evaluate(b => b.click());
    await expect(page.locator('#panel-settings')).not.toHaveClass(/active/);
    await expect(page.locator('#msg, #appToast').filter({ hasText: 'Unauthorized' }).first()).toBeVisible();
  });

  test('server refuses add-admin, save-setting and edit-venue for a helper', async ({ page }) => {
    await openDemo(page, 'admin/index.html', { admin: 'helper' });
    await adminReady(page);
    const attempt = (a, d) => page.evaluate(([a, d]) => { try { DEMO_API.handle(a, d); return 'ok'; } catch (e) { return e.message; } }, [a, d]);
    expect(await attempt('admin.saveAdmin', { Email: 'x@y.z', Name: 'X', Role: 'owner' })).toBe('Unauthorized');
    expect(await attempt('admin.saveSetting', { key: 'couple.brideEn', value: 'Hacked' })).toBe('Unauthorized');
    expect(await attempt('admin.saveVenue', { VenueId: 'V1', NameEn: 'Hacked' })).toBe('Unauthorized');
    const venue = await page.evaluate(() => JSON.parse(localStorage.getItem('demoDB')).Venues.find(v => v.VenueId === 'V1').NameEn);
    expect(venue).not.toBe('Hacked');
  });

  test('owner can see Settings and the venue editor', async ({ page }) => {
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await adminReady(page);
    await page.locator('#tabs [data-tab="settings"]').click();
    await expect(page.locator('#panel-settings')).toHaveClass(/active/);
    await expect(page.locator('#panel-settings')).toContainText('couple.brideEn');
  });
});

test.describe('Salami ledger', () => {
  test('adding a cash gift updates the NPR total', async ({ page }) => {
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await adminReady(page);
    const total = () => page.evaluate(() => JSON.parse(localStorage.getItem('demoDB')).Gifts
      .filter(g => (g.Currency || 'NPR') === 'NPR').reduce((t, g) => t + (Number(g.Amount) || 0), 0));
    const before = await total();
    await page.locator('#tabs [data-tab="gifts"]').click();
    await expect(page.locator('#giftTotals')).toContainText('NPR ' + before.toLocaleString('en-US'));
    await page.locator('#addCash').click();
    const f = page.locator('#cashForm');
    await f.locator('[name=name]').fill('Test Uncle');
    await f.locator('[name=amount]').fill('5001');
    await f.locator('#cashCur label', { hasText: 'NPR' }).click();
    await page.locator('#cashSave').click();
    await expect(page.locator('#cashMsg')).toContainText('Saved');
    expect(await total()).toBe(before + 5001);
    await f.locator('button[value=cancel]').click();
    await expect(page.locator('#giftTotals')).toContainText('NPR ' + (before + 5001).toLocaleString('en-US'));
  });
});

test.describe('Offline check-in resiliency', () => {
  test('3 offline scans queue locally and sync when back online', async ({ page, context }) => {
    await spyApi(page);
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await adminReady(page);
    await page.locator('#tabs [data-tab="door"]').click();
    await expect.poll(() => page.evaluate(() => Door.list().guests.length)).toBe(150);

    await context.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    for (const gid of ['G010', 'G020', 'G030']) await page.evaluate(g => window.doorScanText(g), gid);

    const queue = () => page.evaluate(() => JSON.parse(localStorage.getItem('offlineCheckinQueue') || '[]').length);
    expect(await queue()).toBe(3);
    await expect(page.locator('#doorUndo')).toBeVisible(); // UI reacted instantly
    expect(await page.evaluate(() => Door.list().guests.filter(g => ['G010', 'G020', 'G030'].includes(g.GuestId)).every(g => g.CheckedIn === 'TRUE'))).toBe(true);
    expect(await page.evaluate(() => window.__calls.filter(c => c.a === 'admin.checkIn').length)).toBe(0);

    const onlineFired = page.evaluate(() => new Promise(r => addEventListener('online', () => r(true), { once: true })));
    await context.setOffline(false);
    expect(await onlineFired).toBe(true);
    await expect.poll(queue).toBe(0);
    const sent = await page.evaluate(() => window.__calls.filter(c => c.a === 'admin.checkIn').map(c => c.d.guestId));
    expect(sent.sort()).toEqual(['G010', 'G020', 'G030']);
  });
});
