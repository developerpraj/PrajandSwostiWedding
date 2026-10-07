// Repo hygiene: no tokens committed. Run: npm run backend
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const skip = /node_modules|\.git|\.vs|test-results|coverage|playwright-report|drive-backup/;
function walk(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (skip.test(p)) continue;
    if (f.isDirectory()) walk(p, out);
    else if (/\.(js|gs|html|json|md|css|ps1)$/.test(f.name)) out.push(p);
  }
  return out;
}

test('no GitHub tokens or Google API keys in repo files', () => {
  const bad = walk(root, []).filter(p => /\b(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AIza[0-9A-Za-z_-]{35})\b/.test(fs.readFileSync(p, 'utf8')));
  assert.deepEqual(bad.map(p => path.relative(root, p)), []);
});

test('GitHub token is read only from Script Properties', () => {
  const live = fs.readFileSync(path.join(root, 'apps-script', 'Live.gs'), 'utf8');
  assert.match(live, /getProperty\('GITHUB_TOKEN'\)/);
});
