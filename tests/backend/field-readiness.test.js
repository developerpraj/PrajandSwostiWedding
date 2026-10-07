// Lost-link recovery (findPass) and offline door check-in timestamps, against the real Code.gs.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { seeded } = require('./gas-harness');

test('findPass restores a household from phone + family name', () => {
  const b = seeded();
  const r = b.post('findPass', { phone: '+977-980-000-0001', name: 'sharma' });
  assert.strictEqual(r.data.guestId, 'G001');
  assert.ok(r.data.members.length >= 2);
  assert.ok(!('DOB' in r.data.members[0]), 'no private fields');
  assert.strictEqual(b.post('findPass', { phone: '9800000001', name: 'Sita' }).data.guestId, 'G001', 'member first name works');
});

test('findPass rejects wrong name, short input, and revoked links', () => {
  const b = seeded();
  assert.match(b.post('findPass', { phone: '9800000001', name: 'Thapa' }).error, /No invitation/);
  assert.match(b.post('findPass', { phone: '98', name: 'Sharma' }).error, /phone number and family name/);
  assert.match(b.post('findPass', { phone: '9800000001', name: 'S' }).error, /phone number and family name/);
  assert.match(b.post('findPass', { phone: '9800000003', name: 'Revoked' }).error, /turned off/);
});

test('findPass refuses ambiguous matches instead of guessing', () => {
  const b = seeded();
  b.add('Guests', { GuestId: 'G009', Name: 'Sharma Cousins', Family: 'Sharma', Phone: '9800000001', AdmitCount: 1 });
  assert.match(b.post('findPass', { phone: '9800000001', name: 'Sharma' }).error, /No invitation/);
});

test('offline check-ins keep the scan time, but reject future or stale times', () => {
  const b = seeded();
  const at = new Date(Date.now() - 3600000).toISOString();
  b.admin('admin.checkIn', { guestId: 'G001', at: at });
  assert.strictEqual(b.rows('Guests').find(g => g.GuestId === 'G001').CheckedInAt, at);
  b.admin('admin.checkInMember', { memberId: 'M1', at: '2099-01-01T00:00:00Z' });
  const m = b.rows('Members').find(x => x.MemberId === 'M1');
  assert.strictEqual(m.CheckedIn, 'TRUE');
  assert.ok(new Date(m.CheckedInAt) <= new Date(), 'future time replaced by now');
  b.admin('admin.checkIn', { guestId: 'G002', at: '2000-01-01T00:00:00Z' });
  assert.ok(new Date(b.rows('Guests').find(g => g.GuestId === 'G002').CheckedInAt).getFullYear() > 2000, 'stale time replaced');
});

test('helpers (gate volunteers) may sync offline check-ins', () => {
  const b = seeded();
  assert.strictEqual(b.ctx.roleAllows_('helper', 'admin.checkIn'), true);
  assert.strictEqual(b.ctx.roleAllows_('helper', 'admin.checkInMember'), true);
  assert.strictEqual(b.ctx.roleAllows_('helper', 'admin.saveSetting'), false);
});

// js/door.js is plain browser JS; run it with a fake localStorage.
function door(online) {
  const store = {};
  const ctx = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }, navigator: { onLine: online !== false } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'door.js'), 'utf8'), ctx);
  return { D: ctx.Door, ctx };
}
const LIST = [{ GuestId: 'G1', Name: 'Hari Sharma', Family: 'Sharma', Phone: '980' }, { GuestId: 'G2', Name: 'Gita Thapa', Family: 'Thapa' }];
const PEOPLE = [{ MemberId: 'M1', GuestId: 'G1', Name: 'Ram Sharma', Household: 'Hari Sharma', Band: 'green' }];

test('door: parse handles plain ids, family passes and pass URLs', () => {
  const { D } = door();
  assert.deepStrictEqual({ ...D.parse('G1') }, { guestId: 'G1', memberId: '' });
  assert.deepStrictEqual({ ...D.parse('G1:M1') }, { guestId: 'G1', memberId: 'M1' });
  assert.strictEqual(D.parse('https://x/pass.html?g=G2&m=1').guestId, 'G2');
});

test('door: offline check-in is instant, queued, de-duplicated and survives re-download', () => {
  const { D, ctx } = door(false);
  D.save(LIST, PEOPLE);
  assert.strictEqual(D.search('sha').length, 2, 'member + household match by 3 letters');
  assert.ok(D.checkIn({ guestId: 'G2' }));
  D.checkIn({ guestId: 'G2' });
  assert.strictEqual(D.pending().length, 1);
  assert.strictEqual(D.checkIn({ guestId: 'NOPE' }), null);
  assert.ok(D.search('gita')[0].in);
  D.save(JSON.parse(JSON.stringify(LIST)), PEOPLE);
  assert.ok(D.search('gita')[0].in, 're-download keeps pending check-ins');
  assert.ok(ctx.localStorage.getItem('pending_checkins'));
});

test('door: sync sends queued items, stops on failure and keeps the rest', async () => {
  const { D, ctx } = door(true);
  D.save(LIST, PEOPLE);
  D.checkIn({ guestId: 'G1', memberId: 'M1' });
  D.checkIn({ guestId: 'G2' });
  const calls = [];
  let fail = true;
  const call = async (a, d) => { calls.push([a, d]); if (a === 'admin.checkIn' && fail) throw new Error('net'); };
  let r = await D.sync(call);
  assert.deepStrictEqual([r.sent, r.left], [1, 1]);
  assert.strictEqual(calls[0][0], 'admin.checkInMember');
  assert.ok(calls[0][1].at, 'scan time is sent');
  fail = false;
  r = await D.sync(call);
  assert.deepStrictEqual([r.sent, r.left], [1, 0]);
  ctx.navigator.onLine = false;
  D.checkIn({ guestId: 'G1' });
  r = await D.sync(call);
  assert.deepStrictEqual([r.sent, r.left], [0, 1], 'no network attempts while offline');
});
