// Smoke test: loads demo-data/demo-api.js in a minimal fake browser and calls the main mock actions.
// Usage: node tests/smoke-demo-api.js [path/to/seed.json]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function store() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear(),
    key: i => [...m.keys()][i],
    get length() { return m.size; }
  };
}

const ctx = {
  console, Date, Math, JSON, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage: store(),
  sessionStorage: store(),
  location: { pathname: '/index.html', search: '', reload() {} },
  document: { body: null, documentElement: {}, addEventListener() {}, getElementById: () => null },
  MutationObserver: class { observe() {} }
};
vm.createContext(ctx);
vm.runInContext('var window = globalThis;', ctx);
const seedFile = process.argv[2];
if (seedFile) ctx.localStorage.setItem('demoDB', fs.readFileSync(seedFile, 'utf8'));
const src = fs.readFileSync(path.join(__dirname, '..', 'demo-data', 'demo-api.js'), 'utf8');
vm.runInContext(src, ctx);

const api = vm.runInContext('window.DEMO_API', ctx);
const call = (a, d) => api.handle(a, d);
const ok = [];
const fail = [];
function run(name, fn) {
  try { fn(); ok.push(name); } catch (e) { fail.push(name + ': ' + e.message); }
}

run('getConfig', () => call('getConfig'));
run('getHome', () => call('getHome', { guestId: 'G001' }));
run('getGuest', () => { if (!call('getGuest', { guestId: 'G001' }).guest) throw new Error('no guest'); });
run('getPass', () => call('getPass', { guestId: 'G001' }));
run('getGallery', () => call('getGallery', {}));
run('getGames', () => call('getGames', { guestId: 'G001' }));
run('getLeaderboard', () => call('getLeaderboard'));
run('getMemorial', () => call('getMemorial'));
run('lightDiya', () => call('lightDiya', { guestId: 'G001', name: 'x' }));
run('upload', () => {
  const s = call('startUpload', { guestId: 'G001', fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10 });
  const r = call('finishUpload', { token: s.token, fileId: 'demoX' });
  if (!r || !r.media) throw new Error('no media returned');
});
run('resolveCode', () => call('resolveCode', { code: 'TEEN19' }));
run('register', () => call('register', { guestId: 'G001', form: {}, events: [] }));
['admin.stats', 'admin.guests', 'admin.people', 'admin.settings', 'admin.gifts', 'admin.thankQueue',
  'admin.analytics', 'admin.admins', 'admin.me', 'admin.planner', 'admin.venues'].forEach(a => run(a, () => call(a, {})));
run('admin.saveCashGift', () => call('admin.saveCashGift', { name: 'X', amount: 100, currency: 'NPR' }));
run('admin.checkIn', () => call('admin.checkIn', { guestId: 'G001' }));

console.log('OK ' + ok.length);
if (fail.length) { console.log('FAIL\n' + fail.join('\n')); process.exit(1); }
