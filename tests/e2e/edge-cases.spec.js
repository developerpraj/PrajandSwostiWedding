// "Perfect storm" edge cases: double scans, multi-door check-in, forwarded links, preview bots,
// non-primary RSVP, currency, media types and per-type size limits.
const { test, expect, openDemo } = require('./fixtures');

const db = page => page.evaluate(() => JSON.parse(localStorage.getItem('demoDB')));
const api = (page, a, d) => page.evaluate(([a, d]) => { try { return DEMO_API.handle(a, d); } catch (e) { return { error: e.message }; } }, [a, d]);

test.describe('Door', () => {
  test('double-scan offline queues ONE record', async ({ page, context }) => {
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await page.locator('#tabs [data-tab="door"]').click();
    await expect.poll(() => page.evaluate(() => Door.list().guests.length)).toBe(150);
    await context.setOffline(true);
    await page.evaluate(() => { doorScanText('G011'); doorScanText('G011'); doorScanText('pass.html?g=G011'); });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('offlineCheckinQueue')).length)).toBe(1);
    await context.setOffline(false);
  });

  test('second door never moves the first CheckedInAt', async ({ page }) => {
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await api(page, 'admin.checkIn', { guestId: 'G012', at: '2030-01-01T10:00:00.000Z' });
    const r = await api(page, 'admin.checkIn', { guestId: 'G012', at: '2030-01-01T10:10:00.000Z' });
    expect(r.alreadyIn).toBe(true);
    expect((await db(page)).Guests.find(g => g.GuestId === 'G012').CheckedInAt).toBe('2030-01-01T10:00:00.000Z');
  });
});

test.describe('Links', () => {
  test('preview bot (no interaction) does not mark the invite opened; a real tap does', async ({ page }) => {
    const gid = 'G006';
    await openDemo(page, 'index.html', { guestId: gid });
    await page.evaluate(g => { const d = JSON.parse(localStorage.getItem('demoDB')); const r = d.Guests.find(x => x.GuestId === g); r.InviteOpened = ''; r.InviteOpenedAt = ''; localStorage.setItem('demoDB', JSON.stringify(d)); localStorage.removeItem('opened_' + g); }, gid);
    await page.reload(); await page.waitForFunction(() => !!window.DEMO_API);
    await page.waitForTimeout(800);
    const opened = async () => String((await db(page)).Guests.find(g => g.GuestId === gid).InviteOpened || '').toUpperCase();
    expect(await opened()).not.toBe('TRUE');
    await page.mouse.click(5, 300);
    await expect.poll(opened).toBe('TRUE');
  });

  test('forwarded link shows "Not <name>?" and signs out to find own pass', async ({ page }) => {
    await openDemo(page, 'index.html', { guestId: 'G002' });
    const bar = page.locator('#notYouBar');
    await expect(bar).toBeVisible();
    await bar.locator('[data-not-you]').click();
    await expect(page).toHaveURL(/signin\.html/);
    expect(await page.evaluate(() => localStorage.getItem('guestId'))).not.toBe('G002');
  });
});

test.describe('Data model', () => {
  test('non-primary member RSVP only touches their own row', async ({ page }) => {
    await openDemo(page, 'index.html', { guestId: 'G002' });
    const before = await db(page);
    const fam = before.Members.find(m => m.GuestId === 'G002' && String(m.IsPrimary).toUpperCase() !== 'TRUE')
      || await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('demoDB')); const m = { MemberId: 'MX1', GuestId: 'G002', Name: 'Son Guest', IsPrimary: 'FALSE', Attending: 'TRUE' }; d.Members.push(m); localStorage.setItem('demoDB', JSON.stringify(d)); return m; });
    await page.reload(); await page.waitForFunction(() => !!window.DEMO_API);
    const g0 = (await db(page)).Guests.find(g => g.GuestId === 'G002');
    const r = await api(page, 'register', { guestId: 'G002', memberId: fam.MemberId, form: { Name: fam.Name, Status: 'Attending', Meal: 'Veg' } });
    expect(r.memberOnly).toBe(true);
    const after = await db(page);
    expect(after.Guests.find(g => g.GuestId === 'G002')).toEqual(g0);
    expect(after.Members.find(m => m.MemberId === fam.MemberId).Meal).toBe('Veg');
  });

  test('cash gift cannot be saved until a currency is tapped', async ({ page }) => {
    await openDemo(page, 'admin/index.html', { admin: 'owner' });
    await page.locator('#tabs [data-tab="gifts"]').click();
    await page.locator('#addCash').click();
    const f = page.locator('#cashForm');
    await f.locator('[name=name]').fill('No Currency Uncle');
    await f.locator('[name=amount]').fill('5000');
    await page.locator('#cashSave').click();
    await expect(page.locator('#cashMsg')).toContainText(/NPR or USD/);
    expect((await db(page)).Gifts.some(g => g.Name === 'No Currency Uncle')).toBe(false);
    await f.locator('#cashCur label', { hasText: 'USD' }).click();
    await page.locator('#cashSave').click();
    await expect(page.locator('#cashMsg')).toContainText('Saved');
    expect((await db(page)).Gifts.find(g => g.Name === 'No Currency Uncle').Currency).toBe('USD');
  });
});

test.describe('Media', () => {
  test('MIME inference covers HEIC, AVIF, MOV and empty types', async ({ page }) => {
    await openDemo(page, 'photos.html', { guestId: 'G002' });
    const r = await page.evaluate(() => ['a.HEIC', 'b.heif', 'c.avif', 'd.webp', 'e.MOV', 'f.3gp', 'g.pdf', 'h.jpg'].map(n => {
      const f = new File(['x'], n, { type: '' });
      return [App.mimeOf(f), App.mediaKind(f)];
    }));
    expect(r).toEqual([['image/heic', 'image'], ['image/heif', 'image'], ['image/avif', 'image'], ['image/webp', 'image'],
      ['video/quicktime', 'video'], ['video/3gpp', 'video'], ['', ''], ['image/jpeg', 'image']]);
  });

  test('server enforces 250 MB video / 500 MB photo limits', async ({ page }) => {
    await openDemo(page, 'photos.html', { guestId: 'G002' });
    const MB = 1048576;
    expect((await api(page, 'startUpload', { guestId: 'G002', mimeType: 'video/mp4', size: 251 * MB })).error).toMatch(/250 MB/);
    expect((await api(page, 'startUpload', { guestId: 'G002', mimeType: 'video/mp4', size: 249 * MB })).token).toBeTruthy();
    expect((await api(page, 'startUpload', { guestId: 'G002', mimeType: 'image/heic', size: 300 * MB })).token).toBeTruthy();
    expect((await api(page, 'startUpload', { guestId: 'G002', mimeType: 'application/pdf', size: MB })).error).toMatch(/photos and videos/);
  });

  test('oversized video is rejected in the UI before upload', async ({ page }) => {
    await openDemo(page, 'photos.html', { guestId: 'G002' });
    await page.evaluate(() => {
      const f = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
      Object.defineProperty(f, 'size', { value: 260 * 1048576 });
      const dt = new DataTransfer(); dt.items.add(f);
      const i = document.getElementById('filePick'); i.files = dt.files; i.dispatchEvent(new Event('change'));
    });
    await expect(page.locator('#msg')).toContainText('250 MB');
    await expect(page.locator('#queue .upload-item')).toHaveCount(0);
  });

  test('event picker defaults to an "Auto-detected event" option', async ({ page }) => {
    await openDemo(page, 'photos.html', { guestId: 'G002' });
    await expect(page.locator('#eventSel option').first()).toHaveText('Auto-detected event');
  });
});
