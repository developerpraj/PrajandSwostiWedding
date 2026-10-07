// Admin ops: salami audit, helper duties, phones-down freeze, emergency blast list, table edits.
// Written but not yet run. Run with the backend suite (see docs/HANDOFF.md).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', 'Pure.gs'), 'utf8'), ctx);
const pure = ctx.module.exports;
const { seeded } = require('./gas-harness');

test('dutiesOf_ normalises "[Door], Bar" and ignores unknown duties', () => {
  assert.deepStrictEqual(pure.dutiesOf_('[Door], Bar, juggling, door'), ['door', 'bar']);
  assert.deepStrictEqual(pure.dutiesOf_(''), []);
});

test('duty restrictions: Door helper cannot open the gift ledger; Bar helper can verify age', () => {
  assert.strictEqual(pure.dutyAllows_(['door'], 'admin.checkIn'), true);
  assert.strictEqual(pure.dutyAllows_(['door'], 'admin.gifts'), false);
  assert.strictEqual(pure.dutyAllows_(['bar'], 'admin.verifyAge'), true);
  assert.strictEqual(pure.dutyAllows_(['bar'], 'admin.saveCashGift'), false);
  assert.strictEqual(pure.dutyAllows_([], 'admin.gifts'), true, 'no duties = all helper tools');
  assert.strictEqual(pure.dutyAllows_(['door'], 'admin.me'), true);
});

test('dutyTabs_ only restricts helpers with duties', () => {
  assert.deepStrictEqual(pure.dutyTabs_({ role: 'helper', duties: ['door'] }), ['door']);
  assert.strictEqual(pure.dutyTabs_({ role: 'manager', duties: ['door'] }), null);
  assert.strictEqual(pure.dutyTabs_({ role: 'helper', duties: [] }), null);
});

test('server enforces duties for a helper passcode', () => {
  const b = seeded();
  b.add('Admins', { Email: 'cousin@x.com', Name: 'Cousin', Role: 'helper', Passcode: 'door-pass', Active: 'TRUE', Duties: 'Door' });
  assert.ok(b.admin('admin.checkIn', { guestId: 'G001' }, 'door-pass').ok);
  assert.match(b.admin('admin.gifts', {}, 'door-pass').error, /cannot/);
  const me = b.admin('admin.me', {}, 'door-pass').data;
  assert.deepStrictEqual(me.tabs, ['door']);
});

test('freezeState_: manual, expired, and scheduled windows', () => {
  const now = new Date('2026-02-14T10:30:00Z');
  assert.strictEqual(pure.freezeState_({ 'freeze.on': 'TRUE', 'freeze.messageEn': 'Phones down!' }, now).on, true);
  assert.strictEqual(pure.freezeState_({ 'freeze.on': 'TRUE', 'freeze.until': '2026-02-14T10:00:00Z' }, now).on, false, 'auto-unfreezes');
  const w = pure.freezeState_({ 'freeze.windows': '2026-02-14T10:00:00Z>2026-02-14T11:00:00Z' }, now);
  assert.strictEqual(w.on, true);
  assert.strictEqual(w.until, '2026-02-14T11:00:00.000Z');
  assert.strictEqual(pure.freezeState_({ 'freeze.windows': 'garbage' }, now).on, false);
});

test('freeze blocks games and uploads, hides leaderboard, keeps guest basics', () => {
  const b = seeded();
  b.admin('admin.freeze', { on: true, messageEn: 'Phones down! The Kanyadaan is starting.' });
  const cfg = b.post('getConfig', {}).data;
  assert.strictEqual(cfg.freeze.on, true);
  assert.match(cfg.freeze.messageEn, /Kanyadaan/);
  assert.match(b.post('submitAnswer', { guestId: 'G001', gameId: 'G1', choice: 1 }).error, /Phones down/);
  assert.match(b.post('startUpload', { guestId: 'G001', name: 'a.jpg', size: 10, mime: 'image/jpeg' }).error, /Phones down/);
  assert.deepStrictEqual(b.post('getLeaderboard', {}).data.top, []);
  assert.ok(b.post('getConfig', {}).ok, 'config (schedule/pass shell) still loads');
  b.admin('admin.freeze', { on: false });
  assert.strictEqual(b.post('getConfig', {}).data.freeze.on, false);
});

test('auditGift verifies, requires a note to flag, and rejects bad statuses', () => {
  const b = seeded();
  b.add('Gifts', { GiftId: 'GF1', Name: 'Mama', Amount: 100, Currency: 'USD' });
  b.admin('admin.auditGift', { giftId: 'GF1', status: 'verified' });
  let g = b.rows('Gifts').find(x => x.GiftId === 'GF1');
  assert.strictEqual(g.AuditStatus, 'Verified');
  assert.ok(g.AuditedAt && g.AuditedBy);
  assert.match(b.admin('admin.auditGift', { giftId: 'GF1', status: 'flagged' }).error, /note/);
  b.admin('admin.auditGift', { giftId: 'GF1', status: 'flagged', note: 'found 50' });
  g = b.rows('Gifts').find(x => x.GiftId === 'GF1');
  assert.strictEqual(g.AuditStatus, 'Flagged');
  assert.strictEqual(g.AuditNote, 'found 50');
  assert.match(b.admin('admin.auditGift', { giftId: 'GF1', status: 'maybe' }).error, /Status/);
});

test('blastList_ returns deduped phones of guests not checked in', () => {
  const r = pure.blastList_([
    { Name: 'A', Phone: '+977 980-000-0001', CheckedIn: 'FALSE', Side: 'Bride' },
    { Name: 'A2', Phone: '9779800000001', CheckedIn: '', Side: 'Bride' },
    { Name: 'B', Phone: '9800000002', CheckedIn: 'TRUE', Side: 'Groom' },
    { Name: 'C', Phone: '', Side: 'Groom' },
    { Name: 'D', Phone: '9800000004', Status: 'Declined' },
    { Name: 'E', Phone: '9800000005', Side: 'Groom' }
  ]);
  assert.strictEqual(r.phones, '+9779800000001,+9779800000005');
  assert.strictEqual(pure.blastList_([{ Name: 'E', Phone: '9800000005', Side: 'Groom' }], { side: 'Bride' }).count, 0);
});

test('phoneKey_ treats local and +977 Nepali mobiles as the same number', () => {
  assert.strictEqual(pure.phoneKey_('9800000001'), pure.phoneKey_('+977 980-000-0001'));
  assert.strictEqual(pure.phoneKey_('00977 9800000001'), '9779800000001');
  assert.strictEqual(pure.phoneKey_('+1 (612) 555-0100'), '16125550100');
});

test('blastList_ skips a household when any member has checked in, and revoked links', () => {
  const guests = [{ GuestId: 'G1', Name: 'A', Phone: '9800000001' }, { GuestId: 'G2', Name: 'B', Phone: '9800000002' }, { GuestId: 'G3', Name: 'C', Phone: '9800000003', LinkRevoked: 'TRUE' }];
  const r = pure.blastList_(guests, { members: [{ GuestId: 'G1', CheckedIn: 'TRUE' }] });
  assert.deepStrictEqual(r.people.map(p => p.name), ['B']);
});

test('freezeWindowsValid_ accepts blank/valid windows and explains bad ones', () => {
  assert.strictEqual(pure.freezeWindowsValid_(''), '');
  assert.strictEqual(pure.freezeWindowsValid_('2026-02-14T10:00:00Z>2026-02-14T11:00:00Z; '), '');
  assert.match(pure.freezeWindowsValid_('nope'), /Window 1/);
  assert.match(pure.freezeWindowsValid_('2026-02-14T11:00:00Z>2026-02-14T10:00:00Z'), /ends before/);
});

test('admin.freeze saves a schedule without touching the manual switch, and rejects bad windows', () => {
  const b = seeded();
  const start = new Date(Date.now() - 60000).toISOString(), end = new Date(Date.now() + 3600000).toISOString();
  const r = b.admin('admin.freeze', { windows: start + '>' + end });
  assert.ok(r.ok, r.error);
  assert.strictEqual(r.data.on, true);
  assert.strictEqual(b.post('getConfig', {}).data.freeze.on, true);
  assert.match(b.admin('admin.freeze', { windows: end + '>' + start }).error, /ends before/);
  b.admin('admin.freeze', { windows: '' });
  assert.strictEqual(b.post('getConfig', {}).data.freeze.on, false);
});

test('admin.undoCheckIn reverses a member check-in; Door duty may undo', () => {
  const b = seeded();
  b.add('Admins', { Email: 'd@x.com', Name: 'Door', Role: 'helper', Passcode: 'door-pass', Active: 'TRUE', Duties: 'Door' });
  b.admin('admin.checkInMember', { memberId: 'M1' }, 'door-pass');
  assert.ok(b.admin('admin.undoCheckIn', { memberId: 'M1' }, 'door-pass').ok);
  assert.notStrictEqual(String(b.rows('Members').find(m => m.MemberId === 'M1').CheckedIn).toUpperCase(), 'TRUE');
});

test('Bar and Live duties can load the dashboard analytics', () => {
  assert.strictEqual(pure.dutyAllows_(['bar'], 'admin.analytics'), true);
  assert.strictEqual(pure.dutyAllows_(['live'], 'admin.analytics'), true);
});

test('setTable updates the guest table (Door long-press)', () => {
  const b = seeded();
  b.admin('admin.setTable', { guestId: 'G001', table: '12' });
  assert.strictEqual(String(b.rows('Guests').find(g => g.GuestId === 'G001').Table), '12');
});
