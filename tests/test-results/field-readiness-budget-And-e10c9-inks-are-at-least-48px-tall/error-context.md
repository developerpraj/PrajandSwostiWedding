# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: field-readiness.spec.js >> budget Android with large fonts >> buttons and nav links are at least 48px tall
- Location: e2e\field-readiness.spec.js:105:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "<button type=\"button\" class=\"btn sm\">ठीक छ · OK</button>",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - banner [ref=f1e2]:
    - generic [ref=f1e3]: 🪔 शुभविवाह
    - navigation [ref=f1e4]:
      - link "🏠 गृहपृष्ठ Home" [ref=f1e5] [cursor=pointer]:
        - /url: index.html?g=G003
        - text: 🏠
        - generic [ref=f1e6]: गृहपृष्ठ
        - generic [ref=f1e7]: Home
      - link "🪔 विधि Ceremony" [ref=f1e8] [cursor=pointer]:
        - /url: ceremony.html?g=G003
        - text: 🪔
        - generic [ref=f1e9]: विधि
        - generic [ref=f1e10]: Ceremony
      - link "📷 फोटो Photos" [ref=f1e11] [cursor=pointer]:
        - /url: photos.html?g=G003
        - text: 📷
        - generic [ref=f1e12]: फोटो
        - generic [ref=f1e13]: Photos
      - link "🎲 खेल Games" [ref=f1e14] [cursor=pointer]:
        - /url: games.html?g=G003
        - text: 🎲
        - generic [ref=f1e15]: खेल
        - generic [ref=f1e16]: Games
      - link "🎁 nav.gift" [ref=f1e17] [cursor=pointer]:
        - /url: gift.html?g=G003
      - link "🎫 मेरो पास My Pass" [ref=f1e18] [cursor=pointer]:
        - /url: pass.html?g=G003
        - text: 🎫
        - generic [ref=f1e19]: मेरो पास
        - generic [ref=f1e20]: My Pass
      - link "🪔 आमाको सम्झनामा In Memory of Mom" [ref=f1e21] [cursor=pointer]:
        - /url: memorial.html?g=G003
        - text: 🪔
        - generic [ref=f1e22]: आमाको सम्झनामा
        - generic [ref=f1e23]: In Memory of Mom
    - generic [ref=f1e24]:
      - button "English" [ref=f1e25] [cursor=pointer]
      - button "नेपाली" [ref=f1e26] [cursor=pointer]
      - button "Nepanglish" [ref=f1e27] [cursor=pointer]
    - button "ठूलो अक्षर, सजिलो पेज · Bigger text, simpler screen" [ref=f1e28] [cursor=pointer]: A+
  - generic [ref=f1e29]:
    - generic [ref=f1e30]: स्वागत छ · Welcome, Anil!
    - 'button "Anil होइन? आफ्नै पास खोज्नुहोस् · Not {name}? Find your own pass" [ref=f1e31] [cursor=pointer]'
  - 'link "📝 आफ्नो उपस्थिति पुष्टि गर्नुहोस् · Demo: finish your RSVP - it takes 1 minute › close" [ref=f1e32] [cursor=pointer]':
    - /url: register.html?g=G003
    - generic [ref=f1e33]: 📝
    - generic [ref=f1e34]: "आफ्नो उपस्थिति पुष्टि गर्नुहोस् · Demo: finish your RSVP - it takes 1 minute"
    - generic [ref=f1e35]: ›
    - button "close" [ref=f1e36]: ×
  - generic [ref=f1e37]: "🔴 अहिले भइरहेको · Happening now: मुख्य हलमा खाना सुरु भयो 🍽️ · Dinner is now being served in the main hall 🍽️"
  - main [ref=f1e38]:
    - generic [ref=f1e39]:
      - paragraph [ref=f1e40]: ॥ श्री गणेशाय नमः ॥
      - heading "सीता र राम · Sita & Ram" [level=1] [ref=f1e41]
      - paragraph [ref=f1e42]:
        - generic [ref=f1e43]: हाम्रो शुभविवाह
        - generic [ref=f1e44]: We are getting married
      - generic [ref=f1e45]: "30"
      - generic [ref=f1e46]:
        - generic [ref=f1e47]: दिन बाँकी
        - generic [ref=f1e48]: days to go
      - paragraph [ref=f1e49]: फेरि स्वागत छ · Welcome back, नमस्ते, अनिल कार्की 🙏 · Namaste, Anil Karki 🙏
      - paragraph [ref=f1e50]:
        - link "साइन इन Sign in" [ref=f1e51] [cursor=pointer]:
          - /url: signin.html
          - generic [ref=f1e52]: साइन इन
          - generic [ref=f1e53]: Sign in
        - link "आफ्नो उपस्थिति दर्ता गर्नुहोस् Register your attendance" [ref=f1e54] [cursor=pointer]:
          - /url: register.html?g=G003
          - generic [ref=f1e55]: आफ्नो उपस्थिति दर्ता गर्नुहोस्
          - generic [ref=f1e56]: Register your attendance
        - link "मेरो अतिथि पास हेर्नुहोस् View my guest pass" [ref=f1e57] [cursor=pointer]:
          - /url: pass.html?g=G003
          - generic [ref=f1e58]: मेरो अतिथि पास हेर्नुहोस्
          - generic [ref=f1e59]: View my guest pass
    - generic [ref=f1e60]:
      - link "अर्को कार्यक्रम Next up मेहेन्दी · Mehendi 11/2/2026, 10:00:00 PM · Sharma Niwas, Kathmandu" [ref=f1e61] [cursor=pointer]:
        - /url: pass.html?g=G003
        - generic [ref=f1e62]:
          - generic [ref=f1e63]: अर्को कार्यक्रम
          - generic [ref=f1e64]: Next up
        - generic [ref=f1e65]: मेहेन्दी · Mehendi
        - generic [ref=f1e66]: 11/2/2026, 10:00:00 PM · Sharma Niwas, Kathmandu
      - link "आजको चुनौती Today's challenge दुलाहा-दुलहीसँगको फोटो बाँड्नुहोस् · Share a photo with the couple फोटो बाँड्नुहोस् Share a photo" [ref=f1e67] [cursor=pointer]:
        - /url: photos.html?g=G003
        - generic [ref=f1e68]:
          - generic [ref=f1e69]: आजको चुनौती
          - generic [ref=f1e70]: Today's challenge
        - generic [ref=f1e71]: दुलाहा-दुलहीसँगको फोटो बाँड्नुहोस् · Share a photo with the couple
        - generic [ref=f1e72]:
          - generic [ref=f1e73]: फोटो बाँड्नुहोस्
          - generic [ref=f1e74]: Share a photo
      - link "तपाईंको अंक Your points 15 दुलहीपक्ष 20 · दुलाहापक्ष 35 · Bride side 20 · Groom side 35 खेल्नुहोस् Play" [ref=f1e75] [cursor=pointer]:
        - /url: games.html?g=G003
        - generic [ref=f1e76]:
          - generic [ref=f1e77]: तपाईंको अंक
          - generic [ref=f1e78]: Your points
        - generic [ref=f1e79]: "15"
        - img "दुलहीपक्ष 20 · दुलाहापक्ष 35 · Bride side 20 · Groom side 35" [ref=f1e80]
        - generic [ref=f1e83]:
          - generic [ref=f1e84]: खेल्नुहोस्
          - generic [ref=f1e85]: Play
      - paragraph [ref=f1e86]: 🎁 1 आश्चर्य कार्यक्रम आउँदैछ · surprise events coming
    - generic [ref=f1e87]:
      - heading "स्थान र बाटो Venue & directions" [level=2] [ref=f1e88]:
        - generic [ref=f1e89]: स्थान र बाटो
        - generic [ref=f1e90]: Venue & directions
      - generic [ref=f1e91]:
        - generic [ref=f1e92]:
          - generic [ref=f1e93]:
            - text: काठमाडौं · Kathmandu (main)
            - generic [ref=f1e94]: Pashupati Garden, Kathmandu
            - generic [ref=f1e95]: Main ceremony
          - generic [ref=f1e96]:
            - link "🧭 बाटो हेर्नुहोस् · Navigate" [ref=f1e97] [cursor=pointer]:
              - /url: https://www.google.com/maps/dir/?api=1&destination=Pashupati%20Garden%2C%20Kathmandu
            - button "छान्नुहोस् · Choose" [ref=f1e98] [cursor=pointer]
        - generic [ref=f1e99]:
          - generic [ref=f1e100]:
            - text: मिनियापोलिस · Minneapolis reception
            - generic [ref=f1e101]: Downtown Minneapolis, MN
            - generic [ref=f1e102]: For US guests
          - generic [ref=f1e103]:
            - link "🧭 बाटो हेर्नुहोस् · Navigate" [ref=f1e104] [cursor=pointer]:
              - /url: https://www.google.com/maps/dir/?api=1&destination=Downtown%20Minneapolis%2C%20MN
            - button "छान्नुहोस् · Choose" [ref=f1e105] [cursor=pointer]
    - generic [ref=f1e106]:
      - heading "❦ तपाईंको निमन्त्रणा Your invitation ❦" [level=2] [ref=f1e107]:
        - text: ❦
        - generic [ref=f1e108]: तपाईंको निमन्त्रणा
        - generic [ref=f1e109]: Your invitation
        - text: ❦
      - paragraph [ref=f1e111]: 🕓 अनुरोध पठाइयो - स्वीकृतिको प्रतीक्षा · Requested - waiting for approval
    - generic [ref=f1e112]:
      - generic [ref=f1e113]:
        - heading "पछिल्ला क्षणहरू Latest moments" [level=2] [ref=f1e114]:
          - generic [ref=f1e115]: पछिल्ला क्षणहरू
          - generic [ref=f1e116]: Latest moments
        - link "सबै हेर्नुहोस् See all" [ref=f1e117] [cursor=pointer]:
          - /url: photos.html?g=G003
          - generic [ref=f1e118]: सबै हेर्नुहोस्
          - generic [ref=f1e119]: See all
      - generic [ref=f1e120]:
        - link "Ramesh Thapa" [ref=f1e121] [cursor=pointer]:
          - /url: photos.html?g=G003
        - link "▶ Kamala Sharma" [ref=f1e123] [cursor=pointer]:
          - /url: photos.html?g=G003
          - generic [ref=f1e124]: ▶
          - generic [ref=f1e125]: Kamala Sharma
        - link "▶ Anil Karki" [ref=f1e126] [cursor=pointer]:
          - /url: photos.html?g=G003
          - generic [ref=f1e127]: ▶
          - generic [ref=f1e128]: Anil Karki
        - link "Gita Thapa" [ref=f1e129] [cursor=pointer]:
          - /url: photos.html?g=G003
        - link "Hari Sharma" [ref=f1e131] [cursor=pointer]:
          - /url: photos.html?g=G003
    - link "🪔 हाम्री आमाको मायालु सम्झनामा — एउटा दियो बाल्नुहोस् र सम्झना बाँड्नुहोस् In loving memory of our Mom — light a diya and share a memory" [ref=f1e133] [cursor=pointer]:
      - /url: memorial.html?g=G003
      - generic [ref=f1e134]: 🪔
      - paragraph [ref=f1e135]:
        - generic [ref=f1e136]: हाम्री आमाको मायालु सम्झनामा — एउटा दियो बाल्नुहोस् र सम्झना बाँड्नुहोस्
        - generic [ref=f1e137]: In loving memory of our Mom — light a diya and share a memory
  - contentinfo [ref=f1e138]: 🙏
  - generic [ref=f1e139]:
    - text: 🧪 Demo data - not connected to Google Drive
    - button "Reset" [ref=f1e140] [cursor=pointer]
  - generic [ref=f1e141]:
    - text: बिहे योजनामा सहयोगका लागि यो एपले तपाईंको गतिविधि रेकर्ड गर्छ। · This app records your activity to help plan the wedding.
    - button "ठीक छ · OK" [ref=f1e142] [cursor=pointer]
```

# Test source

```ts
  9   |     'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148 WhatsApp/2.24',
  10  |     'Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Viber/21.0',
  11  |     'Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/450.0]',
  12  |     'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  13  |     'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Mobile/15E148 Safari/604.1'
  14  |   ].map(ua => App.inAppBrowser(ua)));
  15  |   expect(r).toEqual([true, true, true, false, false]);
  16  | });
  17  | 
  18  | test.describe('inside WhatsApp', () => {
  19  |   test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 WhatsApp/2.24' });
  20  | 
  21  |   test('shows the open-in-Chrome banner, and dismissing it sticks for the session', async ({ page }) => {
  22  |     await openDemo(page, 'index.html?g=G003');
  23  |     const b = page.locator('#inAppBanner');
  24  |     await expect(b).toBeVisible();
  25  |     await expect(b).toContainText(/Chrome/);
  26  |     await b.locator('[data-x]').click();
  27  |     await expect(b).toHaveCount(0);
  28  |     await page.reload();
  29  |     await expect(page.locator('#inAppBanner')).toHaveCount(0);
  30  |   });
  31  | 
  32  |   test('sign-in hides Google (disallowed_useragent) and explains why', async ({ page }) => {
  33  |     await openDemo(page, 'signin.html');
  34  |     await page.evaluate(() => { const c = JSON.parse(sessionStorage.getItem('config') || '{}'); c['auth.google'] = 'TRUE'; c['auth.googleClientId'] = 'x'; sessionStorage.setItem('config', JSON.stringify(c)); });
  35  |     await page.reload();
  36  |     await expect(page.locator('#googleBox')).toBeHidden();
  37  |     await expect(page.locator('#msg')).toContainText(/WhatsApp/);
  38  |   });
  39  | });
  40  | 
  41  | test('no banner in a normal browser', async ({ page }) => {
  42  |   await openDemo(page, 'index.html?g=G003');
  43  |   await expect(page.locator('#inAppBanner')).toHaveCount(0);
  44  | });
  45  | 
  46  | test('Find My Pass restores the session from phone + surname and persists it', async ({ page }) => {
  47  |   await openDemo(page, 'signin.html');
  48  |   await page.locator('#findBox summary').click();
  49  |   await page.fill('#findForm [name=phone]', '9800000002');
  50  |   await page.fill('#findForm [name=name]', 'Thapa');
  51  |   await page.locator('#findForm button').click();
  52  |   await page.waitForURL(/index\.html|register\.html/);
  53  |   expect(await page.evaluate(() => localStorage.getItem('guestId'))).toBe('G002');
  54  | });
  55  | 
  56  | test('Find My Pass shows an error for a wrong surname', async ({ page }) => {
  57  |   await openDemo(page, 'signin.html');
  58  |   await page.locator('#findBox summary').click();
  59  |   await page.fill('#findForm [name=phone]', '9800000002');
  60  |   await page.fill('#findForm [name=name]', 'Nobody');
  61  |   await page.locator('#findForm button').click();
  62  |   await expect(page.locator('#msg')).toContainText(/No invitation/);
  63  | });
  64  | 
  65  | test('App.compressImage shrinks large photos under the cap and leaves videos alone', async ({ page }) => {
  66  |   await openDemo(page, 'photos.html?g=G003');
  67  |   const r = await page.evaluate(async () => {
  68  |     const c = document.createElement('canvas'); c.width = 3000; c.height = 2000;
  69  |     const g = c.getContext('2d');
  70  |     for (let i = 0; i < 4000; i++) { g.fillStyle = 'hsl(' + (i * 37 % 360) + ',80%,50%)'; g.fillRect(Math.random() * 3000, Math.random() * 2000, 40, 40); }
  71  |     const png = await new Promise(res => c.toBlob(res, 'image/png'));
  72  |     const big = new File([png], 'big.png', { type: 'image/png', lastModified: 1 });
  73  |     const out = await App.compressImage(big, 300 * 1024);
  74  |     const vid = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' });
  75  |     const small = new File([new Uint8Array(10)], 's.jpg', { type: 'image/jpeg' });
  76  |     return { inSize: big.size, outSize: out.size, type: out.type, name: out.name, vidSame: (await App.compressImage(vid, 1)) === vid, smallSame: (await App.compressImage(small)) === small };
  77  |   });
  78  |   expect(r.outSize).toBeLessThanOrEqual(r.inSize);
  79  |   if (r.outSize < r.inSize) { expect(r.type).toBe('image/jpeg'); expect(r.name).toBe('big.jpg'); }
  80  |   expect(r.vidSame).toBe(true);
  81  |   expect(r.smallSame).toBe(true);
  82  | });
  83  | 
  84  | test('photos page has data saver on by default and one keep-open notice', async ({ page }) => {
  85  |   await openDemo(page, 'photos.html?g=G003');
  86  |   await expect(page.locator('#compressPick')).toBeChecked();
  87  |   await expect(page.locator('#keepOpen')).toHaveCount(1);
  88  |   await expect(page.locator('#catRow')).toHaveCount(1);
  89  |   await expect(page.locator('#anonPick')).toHaveCount(1);
  90  | });
  91  | 
  92  | test('gate pass QR sits on a white quiet zone with a brightness reminder', async ({ page }) => {
  93  |   await page.emulateMedia({ colorScheme: 'dark' });
  94  |   await openDemo(page, 'pass.html?g=G003');
  95  |   const qr = page.locator('#pQr');
  96  |   await expect(qr).toHaveClass(/qr-scan/);
  97  |   expect(await qr.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  98  |   expect(parseFloat(await qr.evaluate(el => getComputedStyle(el).paddingTop))).toBeGreaterThanOrEqual(16);
  99  |   await expect(page.locator('.brightness-tip')).toContainText(/brightness|उज्यालो/);
  100 | });
  101 | 
  102 | test.describe('budget Android with large fonts', () => {
  103 |   test.use({ viewport: { width: 360, height: 640 } });
  104 | 
  105 |   test('buttons and nav links are at least 48px tall', async ({ page }) => {
  106 |     await openDemo(page, 'index.html?g=G003');
  107 |     const small = await page.evaluate(() => [...document.querySelectorAll('.btn, button, .topbar nav a')]
  108 |       .filter(el => el.offsetParent && el.getBoundingClientRect().height < 47.5).map(el => el.outerHTML.slice(0, 80)));
> 109 |     expect(small).toEqual([]);
      |                   ^ Error: expect(received).toEqual(expected) // deep equality
  110 |   });
  111 | 
  112 |   test('mixed mode stacks Nepali above English on narrow screens', async ({ page }) => {
  113 |     await openDemo(page, 'index.html?g=G003');
  114 |     await page.evaluate(() => I18N.set('mix'));
  115 |     const el = page.locator('[data-i18n] .bi-ne').first();
  116 |     await expect(el).toBeVisible();
  117 |     expect(await el.evaluate(e => getComputedStyle(e).display)).toBe('block');
  118 |     expect(await page.evaluate(() => I18N.biHtml('<b>', 'x'))).toContain('&lt;b&gt;');
  119 |   });
  120 | });
  121 | 
  122 | test('ceremony marks the next ritual "Up next" when none is live (no countdown)', async ({ page }) => {
  123 |   await openDemo(page, 'ceremony.html?g=G003');
  124 |   await page.waitForSelector('.rit-card');
  125 |   const live = await page.locator('.rit-card.now').count();
  126 |   if (!live) await expect(page.locator('.rit-badge.next')).toHaveCount(1);
  127 |   await expect(page.locator('text=/\\d\\d:\\d\\d:\\d\\d/')).toHaveCount(0);
  128 | });
  129 | 
  130 | test('door tab: offline check-in by name, queued, then synced when back online', async ({ page, context }) => {
  131 |   await adminLogin(page);
  132 |   await page.locator('#tabs [data-tab="door"]').click();
  133 |   await expect(page.locator('#doorStatus')).toContainText(/saved/);
  134 |   await context.setOffline(true);
  135 |   await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  136 |   const who = await page.evaluate(() => Door.list().guests.find(x => String(x.CheckedIn).toUpperCase() !== 'TRUE').Name);
  137 |   await page.fill('#doorSearch', who);
  138 |   await page.locator('#doorResult [data-door-in]').first().click();
  139 |   await expect(page.locator('#doorResult')).toContainText('✅');
  140 |   expect(await page.evaluate(() => Door.pending().length)).toBe(1);
  141 |   await expect(page.locator('#doorStatus')).toContainText(/waiting to sync/);
  142 |   await context.setOffline(false);
  143 |   await page.evaluate(() => window.dispatchEvent(new Event('online')));
  144 |   await expect.poll(() => page.evaluate(() => Door.pending().length)).toBe(0);
  145 | });
  146 | 
```