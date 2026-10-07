// Runs the real apps-script/*.gs code against in-memory Google services (see gas-harness.js).
// Covers production-only paths the demo-mode browser tests cannot reach.
const test = require('node:test');
const assert = require('node:assert');
const { load, seeded } = require('./gas-harness');

test('setup creates every sheet, default settings and triggers, and is idempotent', () => {
  const b = load({ props: { ADMIN_PASSCODE: 'x' } });
  b.ctx.setup();
  const names = b.active.getSheets().map(s => s.name);
  Object.keys(b.consts.SHEETS).forEach(n => assert.ok(names.includes(n), 'missing sheet ' + n));
  assert.ok(!names.includes('Sheet1'), 'default Sheet1 removed');
  const handlers = b.triggers.map(t => t.getHandlerFunction());
  assert.ok(handlers.includes('nightlyBackup'));
  assert.ok(handlers.includes('healthCheck'));
  assert.ok(!handlers.includes('publishLiveTick'), 'no live trigger without GITHUB_TOKEN');
  const settingsCount = b.rows('Settings').length;
  assert.ok(settingsCount >= b.consts.DEFAULT_SETTINGS.length);
  b.ctx.setup();
  assert.strictEqual(b.rows('Settings').length, settingsCount, 'second setup adds no duplicate settings');
  assert.strictEqual(b.triggers.length, handlers.length, 'second setup adds no duplicate triggers');
});

test('setup installs the live trigger when a GitHub token exists and keeps the admin passcode', () => {
  const b = load({ props: { ADMIN_PASSCODE: 'keep', GITHUB_TOKEN: 't' } });
  b.ctx.setup();
  assert.ok(b.triggers.some(t => t.getHandlerFunction() === 'publishLiveTick'));
  assert.strictEqual(b.props.ADMIN_PASSCODE, 'keep');
  assert.ok(b.props.ROOT_FOLDER_ID);
});

test('doGet and unknown actions', () => {
  const b = seeded();
  assert.strictEqual(JSON.parse(b.ctx.doGet().text).ok, true);
  assert.deepStrictEqual(b.post('nope'), { ok: false, error: 'unknown action' });
  assert.deepStrictEqual(b.admin('admin.nope'), { ok: false, error: 'unknown action' });
  const bad = JSON.parse(b.ctx.doPost({ postData: { contents: '{not json' } }).text);
  assert.strictEqual(bad.ok, false);
});

test('getConfig exposes public settings only and is cached', () => {
  const b = seeded();
  const r = b.post('getConfig');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.data.closed, false);
  assert.ok(Array.isArray(r.data.relationTo));
  assert.ok(r.data.eventDates.length >= 1);
  Object.keys(r.data).forEach(k => assert.ok(!/passcode|token/i.test(k), 'leaked ' + k));
  assert.ok(b.cache.get('config'));
  assert.strictEqual(b.post('getConfig').data.closed, false, 'cache hit path');
});

test('closed app blocks guest actions but keeps memorial when allowed', () => {
  const b = seeded();
  b.setSetting('wedding.endDate', '2000-01-01T00:00');
  assert.deepStrictEqual(b.post('getGuest', { guestId: 'G001' }), { ok: false, error: 'closed' });
  assert.strictEqual(b.post('getConfig').ok, true);
  b.setSetting('app.keepMemorialAfterEnd', 'TRUE');
  assert.strictEqual(b.post('getMemorial').ok, true);
  b.setSetting('app.keepMemorialAfterEnd', 'FALSE');
  assert.deepStrictEqual(b.post('getMemorial'), { ok: false, error: 'closed' });
});

test('revoked and expired links are refused; invalid guest ids error', () => {
  const b = seeded();
  assert.match(b.post('getGuest', { guestId: 'G003' }).error, /turned off/);
  assert.match(b.post('getGuest', { guestId: 'G004' }).error, /expired/);
  assert.match(b.post('getGuest', { guestId: 'NOPE' }).error, /Invalid guest link/);
  assert.match(b.post('resolveCode', { code: 'REVOKE3' }).error, /turned off/);
});

test('getGuest returns events with locked surprises hidden and marks the invite opened', () => {
  const b = seeded();
  const r = b.post('getGuest', { guestId: 'G001' });
  assert.strictEqual(r.ok, true);
  const hid = r.data.events.find(e => e.EventId === 'HID');
  assert.ok(hid && hid.locked && !hid.NameEn && !hid.Venue, 'locked event hides details');
  assert.ok(r.data.events.find(e => e.EventId === 'WED' && !e.locked));
  assert.strictEqual(r.data.memberId, 'M1', 'falls back to primary member');
  assert.strictEqual(b.rows('Guests').find(g => g.GuestId === 'G001').InviteOpened, 'TRUE');
});

test('guest cache: TTL capped at next unlock and invalidated after writes', () => {
  const b = seeded();
  b.post('getGuest', { guestId: 'G001' });
  const key = Object.keys(b.cache.store).find(k => k.indexOf('guest_G001') === 0);
  assert.ok(key, 'cached');
  const ttl = b.cache.store['__ttl_' + key];
  assert.ok(ttl > 0 && ttl <= 600, 'ttl capped by HID unlock, got ' + ttl);
  b.setSetting('feature.attended', 'TRUE');
  assert.strictEqual(b.post('markAttended', { guestId: 'G001', events: [{ EventId: 'MEH', attended: true, count: 3 }] }).ok, true);
  assert.ok(b.cache.get('gv_G001'), 'guest version bumped');
  assert.ok(b.lock.waits >= 1 && b.lock.waits === b.lock.releases, 'public write ran under the lock');
});

test('markAttended ignores events the guest cannot see and clamps counts', () => {
  const b = seeded();
  b.setSetting('feature.attended', 'TRUE');
  b.post('markAttended', { guestId: 'G002', events: [{ EventId: 'MEH', attended: true, count: 999 }, { EventId: 'GHOST', attended: true, count: 1 }] });
  const rows = b.rows('EventRsvp').filter(r => r.GuestId === 'G002');
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(Number(rows[0].AttendedCount), 50);
  b.setSetting('feature.attended', 'FALSE');
  assert.match(b.post('markAttended', { guestId: 'G002', events: [] }).error, /Not available/);
});

test('register validates input and saves the household', () => {
  const b = seeded();
  const form = { Name: 'Hari Thapa', Phone: '9800000002', DOB: '1995-03-03', RelationTo: 'Groom', RelationType: 'Friend', Relation: 'Friend', Status: 'Attending' };
  assert.match(b.post('register', { guestId: 'G002', form: Object.assign({}, form, { Phone: '' }) }).error, /Missing Phone/);
  assert.match(b.post('register', { guestId: 'G002', form: Object.assign({}, form, { RelationTo: 'Martian' }) }).error, /Invalid relation/);
  assert.match(b.post('register', { guestId: 'G002', form, members: [{ Name: 'X', RelationTo: 'Groom' }, { Name: 'x', RelationTo: 'Groom' }] }).error, /Duplicate name/);
  const ok = b.post('register', { guestId: 'G002', form });
  assert.strictEqual(ok.ok, true, ok.error);
  assert.strictEqual(b.rows('Guests').find(g => g.GuestId === 'G002').Registered, 'TRUE');
  b.setSetting('registration.open', 'FALSE');
  assert.match(b.post('register', { guestId: 'G002', form }).error, /Registration closed/);
});

test('accommodation requires the feature, eligibility, and caps people at admit count', () => {
  const b = seeded();
  b.setSetting('feature.accommodation', 'FALSE');
  assert.match(b.post('requestAccommodation', { guestId: 'G001', Nights: 2, People: 2 }).error, /not available/);
  b.setSetting('feature.accommodation', 'TRUE');
  b.setSetting('accommodation.open', 'TRUE');
  assert.match(b.post('requestAccommodation', { guestId: 'G002', Nights: 1, People: 1 }).error, /not available/);
  const r = b.post('requestAccommodation', { guestId: 'G001', Nights: 2, People: 99 });
  assert.strictEqual(r.data.People, 4);
  b.post('requestAccommodation', { guestId: 'G001', Nights: 3, People: 1 });
  assert.strictEqual(b.rows('Accommodation').length, 1, 'second request updates the first');
  const pass = b.post('getPass', { guestId: 'G001' });
  assert.strictEqual(pass.data.accommodationStatus, 'Requested');
  assert.strictEqual(pass.data.members.length, 2);
});

test('sign-in by phone + invite code or DOB; wrong code fails', () => {
  const b = seeded();
  b.setSetting('auth.phone', 'TRUE');
  assert.strictEqual(b.post('signIn', { method: 'phone', phone: '9800000001', code: 'sharma1' }).data.guestId, 'G001');
  assert.strictEqual(b.post('signIn', { method: 'phone', phone: '+977-980-000-0001', code: '1970-01-01' }).data.guestId, 'G001');
  assert.match(b.post('signIn', { method: 'phone', phone: '9800000001', code: 'WRONG' }).error, /No invitation/);
  assert.match(b.post('signIn', { method: 'phone', phone: '1', code: '' }).error, /Enter phone/);
  b.setSetting('auth.phone', 'FALSE');
  assert.match(b.post('signIn', { method: 'phone', phone: '9800000001', code: 'SHARMA1' }).error, /off/);
});

test('resolveCode is case-insensitive and rejects unknown codes', () => {
  const b = seeded();
  assert.strictEqual(b.post('resolveCode', { code: 'thapa22' }).data.guestId, 'G002');
  assert.match(b.post('resolveCode', { code: 'ZZZ' }).error, /not found/);
});

test('leaderboard adds check-in, on-time, score and upload points to the right team', () => {
  const b = seeded();
  b.setSetting('points.checkIn', '5');
  b.setSetting('points.onTime', '0');
  b.add('Scores', { GuestId: 'G001', MemberId: 'M1', Name: 'Ram Sharma', Side: 'Bride', GameId: 'G1', Correct: 'TRUE', Points: 10 });
  const lb = b.post('getLeaderboard').data;
  const ram = lb.top.find(p => p.name === 'Ram Sharma');
  const hari = lb.top.find(p => p.name === 'Hari Thapa');
  assert.strictEqual(ram.points, 10);
  assert.strictEqual(hari.points, 5, 'check-in points for checked-in member');
  assert.ok(Array.isArray(lb.top) && lb.top.length <= 10);
});

test('memorial: diyas, memories, moderation and private memories', () => {
  const b = seeded();
  b.setSetting('memorial.moderation', 'TRUE');
  assert.strictEqual(b.post('lightDiya', { guestId: 'G001', blessing: 'Peace' }).data.diyaCount, 1);
  assert.match(b.post('submitMemory', { text: '   ' }).error, /Empty memory/);
  assert.strictEqual(b.post('submitMemory', { name: 'A', text: 'Pending one' }).data.pending, true);
  b.setSetting('memorial.moderation', 'FALSE');
  b.post('submitMemory', { name: 'B', text: 'Public one' });
  b.post('submitMemory', { name: 'C', text: 'Private one', isPrivate: true });
  const m = b.post('getMemorial').data;
  const texts = m.memories.map(x => x.text);
  assert.ok(texts.includes('Public one'));
  assert.ok(!texts.includes('Private one'));
  assert.strictEqual(m.blessings[0].blessing, 'Peace');
  const book = b.admin('admin.memoryBook').data;
  assert.strictEqual(book.diyas.length, 1);
});

test('upload start validates feature, identity, type and size', () => {
  const b = seeded({ fetch: url => /upload\/drive/.test(url) ? { code: 200, headers: { Location: 'https://upload.example/session' } } : null });
  b.props.ROOT_FOLDER_ID = b.props.ROOT_FOLDER_ID || b.drive.api.createFolder('Wedding').getId();
  assert.match(b.post('startUpload', { mimeType: 'image/jpeg', size: 10 }).error, /tell us your name/);
  assert.match(b.post('startUpload', { guestId: 'G001', mimeType: 'text/plain', size: 10 }).error, /Only photos/);
  assert.match(b.post('startUpload', { guestId: 'G001', mimeType: 'image/jpeg', size: 0 }).error, /too large/);
  const ok = b.post('startUpload', { guestId: 'G001', mimeType: 'image/jpeg', size: 1000, fileName: 'a.jpg', takenAt: new Date().toISOString() });
  assert.strictEqual(ok.ok, true, ok.error);
  assert.strictEqual(ok.data.uploadUrl, 'https://upload.example/session');
  const saved = JSON.parse(b.cache.get('up_' + ok.data.token));
  assert.strictEqual(saved.guestId, 'G001');
  assert.ok(saved.eventId, 'event auto-routed from capture time');
  b.setSetting('feature.media', 'FALSE');
  assert.match(b.post('startUpload', { guestId: 'G001', mimeType: 'image/jpeg', size: 1 }).error, /Sharing is off/);
});

test('finishUpload rejects expired tokens and files outside the uploads folder, then saves', () => {
  const b = seeded({ fetch: () => ({ code: 200, headers: { Location: 'https://u' } }) });
  assert.match(b.post('finishUpload', { token: 'nope', fileId: 'x' }).error, /expired/);
  const t = b.post('startUpload', { guestId: 'G001', mimeType: 'image/jpeg', size: 10, fileName: 'p.jpg' }).data.token;
  const stray = b.drive.file('stray.jpg', null);
  assert.match(b.post('finishUpload', { token: t, fileId: stray.id }).error, /Invalid file/);
  const up = b.drive.api.getFolderById(b.props.UPLOADS_FOLDER_ID);
  const good = b.drive.file('p.jpg', up.createFolder('Wedding').id);
  const r = b.post('finishUpload', { token: t, fileId: good.id });
  assert.strictEqual(r.ok, true, r.error);
  assert.deepStrictEqual(good.sharing, ['ANYONE_WITH_LINK', 'VIEW']);
  assert.strictEqual(b.rows('Media').length, 1);
  assert.match(b.post('finishUpload', { token: t, fileId: good.id }).error, /Already saved/);
});

test('admin auth: bad key denied, roles enforced, owner allowed', () => {
  const b = seeded();
  assert.deepStrictEqual(b.admin('admin.stats', {}, 'wrong'), { ok: false, error: 'unauthorized' });
  b.add('Admins', { Email: 'h@x.com', Name: 'Helper', Role: 'helper', Passcode: 'help-1', Active: 'TRUE' });
  b.add('Admins', { Email: 'm@x.com', Name: 'Mgr', Role: 'manager', Passcode: 'mgr-1', Active: 'TRUE' });
  b.add('Admins', { Email: 'o@x.com', Name: 'Off', Role: 'manager', Passcode: 'off-1', Active: 'FALSE' });
  assert.strictEqual(b.admin('admin.checkInMember', { memberId: 'M1' }, 'help-1').ok, true);
  assert.match(b.admin('admin.saveGame', {}, 'help-1').error, /role \(helper\)/);
  assert.match(b.admin('admin.saveSetting', { key: 'a', value: 'b' }, 'mgr-1').error, /role \(manager\)/);
  assert.strictEqual(b.admin('admin.events', {}, 'mgr-1').ok, true);
  assert.strictEqual(b.admin('admin.events', {}, 'off-1').error, 'unauthorized');
  assert.deepStrictEqual(b.admin('admin.me').data, { name: 'Owner', role: 'owner' });
  assert.ok(b.rows('Admins').find(a => a.Passcode === 'help-1').LastSeen, 'last seen stamped');
});

test('admin team management masks passcodes and deactivates instead of deleting', () => {
  const b = seeded();
  assert.match(b.admin('admin.saveAdmin', { Email: '' }).error, /Email required/);
  const r = b.admin('admin.saveAdmin', { Email: 'New@X.com', Name: 'N', Role: 'superuser' });
  assert.ok(r.data.passcode.length >= 8);
  const row = b.rows('Admins').find(a => a.Email === 'new@x.com');
  assert.strictEqual(row.Role, 'helper', 'unknown roles fall back to helper');
  assert.ok(b.admin('admin.admins').data.every(a => !a.Passcode || a.Passcode.indexOf('••••') === 0));
  assert.strictEqual(b.admin('admin.saveAdmin', { Email: 'new@x.com', Name: 'N2', Role: 'manager' }).data.passcode, '', 'no reset keeps passcode');
  b.admin('admin.deleteAdmin', { email: 'NEW@x.com' });
  assert.strictEqual(b.rows('Admins').find(a => a.Email === 'new@x.com').Active, 'FALSE');
});

test('admin guest CRUD, link control and soft delete archive', () => {
  const b = seeded();
  const id = b.admin('admin.saveGuest', { Name: 'New Family', RelationTo: 'Groom', DOB: '1990-01-01' }).data;
  const g = b.rows('Guests').find(x => x.GuestId === id);
  assert.strictEqual(g.Side, 'Groom');
  assert.strictEqual(g.Status, 'Pending');
  assert.ok(g.InviteCode);
  b.admin('admin.saveGuest', { GuestId: id, Table: '7' });
  assert.strictEqual(String(b.rows('Guests').find(x => x.GuestId === id).Table), '7');
  const lc = b.admin('admin.linkControl', { guestId: id, revoked: true, newCode: true }).data;
  assert.strictEqual(lc.LinkRevoked, 'TRUE');
  assert.notStrictEqual(lc.InviteCode, g.InviteCode);
  b.admin('admin.linkControl', { guestId: id, revoked: false });
  assert.strictEqual(b.post('getGuest', { guestId: id }).ok, true, 'restored link works');
  b.setSetting('data.softDelete', 'TRUE');
  b.admin('admin.deleteGuest', { guestId: 'G001' });
  assert.ok(!b.rows('Guests').some(x => x.GuestId === 'G001'));
  assert.ok(!b.rows('Members').some(x => x.GuestId === 'G001'), 'members removed with household');
});

test('admin check-in, settings, live post and rituals', () => {
  const b = seeded();
  b.admin('admin.checkIn', { guestId: 'G002' });
  assert.strictEqual(b.rows('Guests').find(g => g.GuestId === 'G002').CheckedIn, 'TRUE');
  b.admin('admin.saveSetting', { key: 'couple.names', value: 'P & S' });
  assert.strictEqual(b.rows('Settings').find(s => s.Key === 'couple.names').Value, 'P & S');
  assert.strictEqual(b.cache.get('settings'), null, 'settings cache cleared');
  b.admin('admin.postLive', { messageEn: 'First' });
  b.admin('admin.postLive', { messageEn: 'Second', messageNe: 'दोस्रो' });
  assert.strictEqual(b.post('getLive').data.en, 'Second');
  assert.strictEqual(b.rows('Live').filter(l => l.Active === 'TRUE').length, 1);
  b.admin('admin.postLive', {});
  assert.strictEqual(b.post('getLive').data, null, 'empty post clears banner');
  const rit = b.admin('admin.rituals').data;
  assert.ok(rit.length > 0);
  assert.strictEqual(b.admin('admin.saveRitual', { NameEn: 'Extra' }).ok, true);
});

test('admin stats and media export return structured data', () => {
  const b = seeded();
  assert.strictEqual(b.admin('admin.stats').ok, true);
  b.add('Media', { MediaId: 'X1', EventId: 'WED', DriveFileId: 'abc', Name: 'A', Status: 'Approved', Timestamp: new Date().toISOString(), SizeBytes: 2097152 });
  const ex = b.admin('admin.mediaExport').data;
  assert.strictEqual(ex[0].event, 'Wedding');
  assert.strictEqual(ex[0].sizeMB, 2);
  assert.match(ex[0].download, /id=abc$/);
});

test('activity logging masks secrets and never breaks the request', () => {
  const b = seeded();
  b.props.ROOT_FOLDER_ID = b.props.ROOT_FOLDER_ID || b.drive.api.createFolder('Wedding').getId();
  b.post('track', { event: 'click', guestId: 'G001', passcode: 'secret' }, { client: { page: 'index.html' } });
  const logId = b.props.GUEST_LOG_ID;
  assert.ok(logId, 'guest log created');
  const rows = b.books[logId].sheets[0].rows;
  const last = rows[rows.length - 1];
  assert.strictEqual(last[1], 'ui.click');
  assert.ok(!JSON.stringify(last).includes('secret'));
  b.post('trackBatch', { events: [{ event: 'a' }, { event: 'b' }] });
  assert.strictEqual(b.books[logId].sheets[0].rows.length, rows.length + 2);
  b.setSetting('log.activity', 'FALSE');
  const before = b.books[logId].sheets[0].rows.length;
  b.post('track', { event: 'c' });
  assert.strictEqual(b.books[logId].sheets[0].rows.length, before);
});
