// Static checks: demo backend mirrors every Apps Script action; Apps Script files are wired correctly. Run: npm run backend
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const gsFiles = fs.readdirSync(path.join(root, 'apps-script')).filter(f => f.endsWith('.gs'));
const gs = gsFiles.map(f => read('apps-script/' + f)).join('\n');
const code = read('apps-script/Code.gs');
const demo = read('demo-data/demo-api.js');

function keys(block) {
  const out = [];
  const re = /^\s*'?([A-Za-z.]+)'?\s*:/gm;
  let m;
  while ((m = re.exec(block))) out.push(m[1]);
  return out;
}
const publicKeys = keys(code.slice(code.indexOf('const PUBLIC_ACTIONS'), code.indexOf('const ADMIN_ACTIONS')));
const adminKeys = keys(code.slice(code.indexOf('const ADMIN_ACTIONS'), code.indexOf('// ---------- Setup'))).filter(k => k.startsWith('admin.'));

test('action lists were parsed', () => {
  assert.ok(publicKeys.length > 20, 'public: ' + publicKeys.length);
  assert.ok(adminKeys.length > 40, 'admin: ' + adminKeys.length);
});

test('every public action exists in demo-api.js', () => {
  const missing = publicKeys.filter(k => !new RegExp("['\\s]" + k.replace(/\./g, '\\.') + "'?\\s*:").test(demo));
  assert.deepEqual(missing, []);
});

test('every admin action exists in demo-api.js', () => {
  const missing = adminKeys.filter(k => demo.indexOf("'" + k + "'") < 0);
  assert.deepEqual(missing, []);
});

test('no function is defined twice across apps-script/*.gs', () => {
  const names = [...gs.matchAll(/^function ([A-Za-z0-9_]+)\s*\(/gm)].map(m => m[1]);
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  assert.deepEqual(dup, []);
});

test('every trigger handler named in setup exists', () => {
  const handlers = [...code.matchAll(/newTrigger\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1]);
  assert.ok(handlers.includes('publishLiveTick') && handlers.includes('healthCheck'));
  handlers.forEach(h => assert.match(gs, new RegExp('^function ' + h + '\\s*\\(', 'm'), h));
});

test('new settings exist in DEFAULT_SETTINGS, demo and Settings.csv', () => {
  const csv = read('drive-backup/Wedding/Sheets/Settings.csv');
  ['points.checkIn', 'points.onTime', 'feature.elderMode', 'app.helpPhone', 'media.largeAlbumUrl'].forEach(k => {
    assert.ok(code.includes("['" + k + "'"), 'Code.gs ' + k);
    assert.ok(demo.includes("S('" + k + "'"), 'demo ' + k);
    assert.ok(csv.includes(k + ','), 'csv ' + k);
  });
});

test('setup does not blindly delete Sheet1', () => {
  assert.doesNotMatch(code, /ss\.deleteSheet\(ss\.getSheetByName\('Sheet1'\)\)/);
  assert.match(code, /getSheetByName\('Sheet1'\)/);
});

test('public writes run inside the script lock', () => {
  assert.match(code, /PUBLIC_WRITE_ACTIONS\.indexOf\(action\) >= 0 \? withLock_/);
});

test('live.json seed is valid and service worker never caches it', () => {
  const live = JSON.parse(read('live.json'));
  ['live', 'ritual', 'teams', 'top', 'closed', 'updatedAt'].forEach(k => assert.ok(k in live, k));
  assert.match(read('sw.js'), /live\\\.json/);
});
