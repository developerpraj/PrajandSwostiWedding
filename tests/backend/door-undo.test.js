// Door offline queue: check-in + undo (js/door.js) in a fake localStorage. Written but not yet run.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDoor() {
  const store = {};
  const ctx = {
    window: {}, navigator: { onLine: false },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'door.js'), 'utf8'), ctx);
  return ctx.window.Door;
}

test('undo of an unsynced check-in only removes it from the queue', () => {
  const Door = loadDoor();
  Door.save([{ GuestId: 'G1', Name: 'Sharma' }], [{ GuestId: 'G1', MemberId: 'M1', Name: 'Ram' }]);
  Door.checkIn({ guestId: 'G1', memberId: 'M1' });
  assert.equal(Door.pending().length, 1);
  assert.equal(Door.undo({ guestId: 'G1', memberId: 'M1' }), 'local');
  assert.equal(Door.pending().length, 0);
  assert.notEqual(Door.list().people[0].CheckedIn, 'TRUE');
});

test('undo of an already-synced check-in asks for a server undo', () => {
  const Door = loadDoor();
  Door.save([{ GuestId: 'G1', Name: 'Sharma', CheckedIn: 'TRUE' }], []);
  assert.equal(Door.undo({ guestId: 'G1' }), 'server');
  assert.notEqual(Door.list().guests[0].CheckedIn, 'TRUE');
});
