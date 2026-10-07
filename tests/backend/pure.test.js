// Unit tests for apps-script/Pure.gs (no Google services needed). Run: npm run backend
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', 'Pure.gs'), 'utf8');
const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const P = ctx.module.exports;

test('sideOf_', () => {
  assert.equal(P.sideOf_('Bride'), 'Bride');
  assert.equal(P.sideOf_("Groom's family"), 'Groom');
  assert.equal(P.sideOf_('Both'), 'Both');
  assert.equal(P.sideOf_(''), '');
});

test('groupsFor_ and matches_', () => {
  const g = P.groupsFor_({ RelationTo: "Bride's family", RelationType: 'Family', Groups: 'VIP, Mehendi' }, null);
  ['all', 'bride', 'bride-family', 'family', 'vip', 'mehendi'].forEach(x => assert.ok(g.includes(x), x));
  assert.equal(new Set(g).size, g.length, 'no duplicates');
  assert.ok(P.matches_('All', ['all']));
  assert.ok(P.matches_('', ['all']));
  assert.ok(P.matches_('groom, vip', g));
  assert.ok(!P.matches_('groom', g));
  const both = P.groupsFor_({ RelationTo: 'Both', RelationType: 'Friend' }, null);
  assert.ok(both.includes('bride-friend') && both.includes('groom-friend'));
  const member = P.groupsFor_({ RelationTo: 'Bride' }, { RelationTo: 'Groom', RelationType: 'Colleague' });
  assert.ok(member.includes('groom-colleague') && !member.includes('bride'));
});

test('ageFrom_ birthday edges', () => {
  const now = new Date(2026, 11, 12);
  assert.equal(P.ageFrom_('2008-12-12', now), 18);
  assert.equal(P.ageFrom_('2008-12-13', now), 17);
  assert.equal(P.ageFrom_('', now), '');
  assert.equal(P.ageFrom_('not a date', now), '');
});

test('bandFrom_', () => {
  assert.equal(P.bandFrom_(30, 18, 'TRUE', 'TRUE'), 'blue');
  assert.equal(P.bandFrom_(17, 18, false, true), 'red');
  assert.equal(P.bandFrom_('', 18, false, false), 'red');
  assert.equal(P.bandFrom_(18, 18, false, false), 'yellow');
  assert.equal(P.bandFrom_(18, 18, false, 'TRUE'), 'green');
  assert.equal(P.bandFrom_(19, 21, false, true), 'red');
});

test('isOnTime_', () => {
  assert.ok(P.isOnTime_('2026-12-12T09:59:00Z', '2026-12-12T10:00:00Z'));
  assert.ok(P.isOnTime_('2026-12-12T10:00:00Z', '2026-12-12T10:00:00Z'));
  assert.ok(!P.isOnTime_('2026-12-12T10:01:00Z', '2026-12-12T10:00:00Z'));
  assert.ok(!P.isOnTime_('', '2026-12-12T10:00:00Z'));
});

test('eventForTime_', () => {
  const ev = [
    { EventId: 'WED', DateTime: '2026-12-12T10:00:00Z' },
    { EventId: 'MEH', DateTime: '2026-12-10T16:00:00Z' },
    { EventId: 'REC', DateTime: '2026-12-12T18:00:00Z' },
    { EventId: 'BAD', DateTime: '' }
  ];
  assert.equal(P.eventForTime_(ev, '2026-12-10T15:00:00Z'), 'MEH');
  assert.equal(P.eventForTime_(ev, '2026-12-11T12:00:00Z'), '', 'gap day has no event');
  assert.equal(P.eventForTime_(ev, '2026-12-12T08:30:00Z'), 'WED');
  assert.equal(P.eventForTime_(ev, '2026-12-12T15:59:00Z'), 'WED');
  assert.equal(P.eventForTime_(ev, '2026-12-12T16:00:00Z'), 'REC', 'next event window starts 2h early');
  assert.equal(P.eventForTime_(ev, ''), '');
  assert.equal(P.eventForTime_([], '2026-12-12T10:00:00Z'), '');
});

test('teamTotals_', () => {
  const t = P.teamTotals_([{ side: 'Bride', points: 10 }, { side: 'Groom', points: '5' }, { side: 'Both', points: 7 }, { side: '', points: 3 }]);
  assert.equal(t.Bride, 10);
  assert.equal(t.Groom, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(P.teamTotals_([]))), { Bride: 0, Groom: 0 });
});

test('PUBLIC_WRITE_ACTIONS are real public actions', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', 'Code.gs'), 'utf8');
  const block = code.slice(code.indexOf('const PUBLIC_ACTIONS'), code.indexOf('const ADMIN_ACTIONS'));
  P.PUBLIC_WRITE_ACTIONS.forEach(a => assert.match(block, new RegExp('\\b' + a + ':'), a));
});
