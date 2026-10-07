const { test, expect, openDemo, resetDemo, adminLogin } = require('./fixtures');

const guestPages = ['index.html', 'register.html', 'photos.html', 'ceremony.html', 'gift.html', 'games.html', 'pass.html', 'memorial.html', 'signin.html', 'slideshow.html', 'whisper.html'];

test.beforeEach(async ({ page }) => { await resetDemo(page); });

for (const p of guestPages) {
  test('guest page loads without errors: ' + p, async ({ page }) => {
    await openDemo(page, p);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toBeEmpty();
  });
}

for (const p of ['admin/index.html', 'admin/planner.html', 'admin/nametags.html']) {
  test('admin page loads without errors: ' + p, async ({ page }) => {
    await adminLogin(page, p);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toBeEmpty();
  });
}