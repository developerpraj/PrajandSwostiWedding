// Load test against the deployed Apps Script /exec URL (not run automatically).
// Usage: node tests/load/load-test.js <API_URL> [concurrency=50] [action=getConfig]
// Rehearse at least a week before the wedding; Apps Script allows ~30 simultaneous executions.
const [, , url, n = '50', action = 'getConfig'] = process.argv;
if (!url) { console.error('Usage: node load-test.js <API_URL> [concurrency] [action]'); process.exit(1); }

async function one(i) {
  const t = Date.now();
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action, data: {} }), redirect: 'follow' });
    const j = await r.json().catch(() => ({ ok: false, error: 'bad json ' + r.status }));
    return { ms: Date.now() - t, ok: !!j.ok, error: j.error };
  } catch (e) { return { ms: Date.now() - t, ok: false, error: e.message }; }
}

(async () => {
  const res = await Promise.all(Array.from({ length: Number(n) }, (_, i) => one(i)));
  const ms = res.map(r => r.ms).sort((a, b) => a - b);
  const pct = p => ms[Math.min(ms.length - 1, Math.floor(ms.length * p))];
  const errs = res.filter(r => !r.ok);
  console.log(`${action} x${n}: ok=${res.length - errs.length} errors=${errs.length} p50=${pct(0.5)}ms p95=${pct(0.95)}ms max=${ms[ms.length - 1]}ms`);
  [...new Set(errs.map(e => e.error))].slice(0, 5).forEach(e => console.log('  error:', e));
  process.exit(errs.length ? 1 : 0);
})();
