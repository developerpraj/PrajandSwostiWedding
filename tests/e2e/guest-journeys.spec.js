// Guest journeys against the seeded demo database (tests/seed.json, see generateMockData.js).
// Seed fixtures: G001 = 19 y/o Bride side (TEEN19), G002 = 25 y/o Groom side verified (ADULT25),
// G003 = Bride side adult, G004 = revoked link. Legal drinking age in the seed is 21.
const { test, expect, openDemo } = require('./fixtures');

const toast = page => page.locator('#appToast');
const apiCalls = (page, action) => page.evaluate(a => (window.__calls || []).filter(x => x === a).length, action);

// Count every demo API call by wrapping DEMO_API.handle once it exists (the "network interceptor" for demo mode).
async function spyApi(page) {
  await page.addInitScript(() => {
    window.__calls = [];
    const wrap = () => {
      if (!window.DEMO_API || window.DEMO_API.__spied) return !!window.DEMO_API;
      const h = window.DEMO_API.handle;
      window.DEMO_API.handle = function (a, d) { window.__calls.push(a); return h.call(this, a, d); };
      window.DEMO_API.__spied = true;
      return true;
    };
    const t = setInterval(() => { if (wrap()) clearInterval(t); }, 1);
    document.addEventListener('DOMContentLoaded', wrap);
  });
}

test.describe('Auth & routing', () => {
  test('phone sign-in finds the right household', async ({ page }) => {
    await openDemo(page, 'signin.html', { guestId: '' });
    const f = page.locator('#phoneForm');
    await expect(f).toBeVisible();
    await f.locator('[name=phone]').fill('+977 9811000002');
    await f.locator('[name=code]').fill('ADULT25');
    await f.locator('button').click();
    await page.waitForURL(/index\.html|register\.html/);
    expect(await page.evaluate(() => localStorage.getItem('guestId'))).toBe('G002');
  });

  test('magic link (?g=) signs the guest in', async ({ page }) => {
    await openDemo(page, 'index.html?g=G003', { guestId: '' });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('guestId'))).toBe('G003');
  });

  test('revoked link is refused', async ({ page }) => {
    test.info().annotations.push({ type: 'allow-errors' });
    await openDemo(page, 'pass.html', { guestId: 'G004' });
    const r = await page.evaluate(() => { try { DEMO_API.handle('getPass', { guestId: 'G004' }); return 'ok'; } catch (e) { return e.message; } });
    expect(r).toMatch(/turned off/);
  });

  test('19-year-old gets a RED band on the pass', async ({ page }) => {
    await openDemo(page, 'pass.html', { guestId: 'G001' });
    await expect(page.locator('#pBand')).toHaveClass(/\bred\b/);
  });

  test('25-year-old (ID verified) gets a GREEN band on the pass', async ({ page }) => {
    await openDemo(page, 'pass.html', { guestId: 'G002' });
    await expect(page.locator('#pBand')).toHaveClass(/\bgreen\b/);
  });

  test('Groom side sees Janti, Bride side does not', async ({ page }) => {
    await openDemo(page, 'index.html', { guestId: 'G002' });
    const names = gid => page.evaluate(g => DEMO_API.handle('getGuest', { guestId: g }).events.map(e => e.NameEn), gid);
    expect(await names('G002')).toContain('Janti');
    expect(await names('G003')).not.toContain('Janti');
    expect(await names('G001')).not.toContain('Janti');
  });

  test('Janti is rendered on the Groom guest RSVP page only', async ({ browser }) => {
    for (const [gid, visible] of [['G002', true], ['G003', false]]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await openDemo(page, 'register.html', { guestId: gid });
      const row = page.locator('#events [data-event="E2"]');
      if (visible) await expect(row).toHaveCount(1); else { await page.waitForSelector('#events [data-event]'); await expect(row).toHaveCount(0); }
      await ctx.close();
    }
  });
});

test.describe('RSVP & forms', () => {
  test('RSVP submit is optimistic and saved', async ({ page }) => {
    await openDemo(page, 'register.html', { guestId: 'G003' });
    const btn = page.locator('#submitBtn');
    await expect(btn).toBeVisible();
    await page.evaluate(() => { document.querySelectorAll('#regForm [required]').forEach(el => { if (el.type === 'checkbox') el.checked = true; else if (el.tagName === 'SELECT') { if (!el.value && el.options.length) el.selectedIndex = el.options.length - 1; } else if (!el.value) el.value = el.type === 'date' ? '1985-01-01' : (el.type === 'tel' ? '+977 9811000003' : 'Test'); }); });
    // Optimistic: button locks in the same tick as the click, before the API resolves.
    expect(await btn.evaluate(b => { b.click(); return b.disabled; })).toBe(true);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('demoDB')).Guests.find(g => g.GuestId === 'G003').Registered)).toBe('TRUE');
  });

  test('frantic double-clicker: 10 clicks in 100ms send exactly ONE register request', async ({ page }) => {
    await spyApi(page);
    await openDemo(page, 'register.html', { guestId: 'G003' });
    const btn = page.locator('#submitBtn');
    await expect(btn).toBeVisible();
    await page.evaluate(() => { document.querySelectorAll('#regForm [required]').forEach(el => { if (el.type === 'checkbox') el.checked = true; else if (el.tagName === 'SELECT') { if (!el.value && el.options.length) el.selectedIndex = el.options.length - 1; } else if (!el.value) el.value = el.type === 'date' ? '1985-01-01' : (el.type === 'tel' ? '+977 9811000003' : 'Test'); }); });
    await btn.evaluate(b => { for (let i = 0; i < 10; i++) b.click(); });
    await page.waitForTimeout(800);
    expect(await apiCalls(page, 'register')).toBe(1);
  });
});

test.describe('Interactive features', () => {
  test('Light a Diya shows success and increments the count', async ({ page }) => {
    await openDemo(page, 'memorial.html', { guestId: 'G003' });
    const before = await page.evaluate(() => DEMO_API.handle('getMemorial').diyaCount);
    await page.locator('#diyaForm [name=blessing]').fill('Om Shanti');
    await page.locator('#diyaForm button').click();
    await expect(toast(page)).toBeVisible();
    await expect.poll(() => page.evaluate(() => DEMO_API.handle('getMemorial').diyaCount)).toBe(before + 1);
  });

  test('quiz answer shows a toast', async ({ page }) => {
    await openDemo(page, 'games.html', { guestId: 'G003' });
    const opt = page.locator('button[data-game="GM1"]').first();
    await expect(opt).toBeVisible();
    await opt.click();
    await expect(toast(page)).toBeVisible();
    await expect(page.locator('button[data-game="GM1"]').first()).toBeDisabled();
  });

  test('photo upload shows a success toast', async ({ page }) => {
    await openDemo(page, 'photos.html', { guestId: 'G003' });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.locator('#filePick').setInputFiles({ name: 'dummy.png', mimeType: 'image/png', buffer: png });
    await expect(toast(page)).toBeVisible({ timeout: 10000 });
    await expect(toast(page)).not.toHaveClass(/err/);
  });
});
