// Live.gs (static live.json publisher) and Health.gs (hourly alerts) against mocked UrlFetch/Mail.
const test = require('node:test');
const assert = require('node:assert');
const { seeded } = require('./gas-harness');

test('publishLive_ skips without a token and never throws', () => {
  const b = seeded();
  assert.strictEqual(b.ctx.publishLive_(true), false);
  assert.strictEqual(b.fetches.length, 0);
});

test('publishLive_ PUTs base64 payload with existing sha, then throttles', () => {
  const b = seeded({
    props: { GITHUB_TOKEN: 'tok', GITHUB_REPO: 'o/r' },
    fetch: (url, p) => (p.method === 'put' ? { code: 200 } : { code: 200, body: JSON.stringify({ sha: 'abc' }) })
  });
  b.admin('admin.postLive', { messageEn: 'Dinner now' });
  b.cache.remove('live_pub');
  b.fetches.length = 0;
  assert.strictEqual(b.ctx.publishLive_(false), true);
  const put = b.fetches.find(f => f.params.method === 'put');
  assert.match(put.url, /repos\/o\/r\/contents\/live\.json$/);
  const body = JSON.parse(put.params.payload);
  assert.strictEqual(body.sha, 'abc');
  assert.strictEqual(body.branch, 'main');
  const live = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
  assert.strictEqual(live.live.en, 'Dinner now');
  assert.strictEqual(live.closed, false);
  assert.ok(Array.isArray(live.teams));
  assert.strictEqual(b.ctx.publishLive_(false), false, 'throttled');
  assert.strictEqual(b.ctx.publishLive_(true), true, 'force bypasses throttle');
});

test('publishLive_ logs GitHub errors and network failures', () => {
  let mode = 'http';
  const b = seeded({
    props: { GITHUB_TOKEN: 'tok', GITHUB_REPO: 'o/r' },
    fetch: (url, p) => mode === 'net' ? { throw: 'offline' } : p.method === 'put' ? { code: 422, body: 'bad' } : { code: 404 }
  });
  assert.strictEqual(b.ctx.publishLive_(true), false);
  mode = 'net';
  assert.strictEqual(b.ctx.publishLive_(true), false);
  const errs = b.rows('AuditLog').filter(r => r.Action === 'live.publish.error');
  assert.strictEqual(errs.length, 2);
  assert.match(String(errs[0].Details), /^422/);
});

test('healthCheck is silent when healthy and checks the custom domain', () => {
  const b = seeded({ props: { GITHUB_TOKEN: 't' }, fetch: () => ({ code: 200 }) });
  assert.strictEqual(b.ctx.healthCheck(), true);
  assert.strictEqual(b.mail.length, 0);
  assert.match(b.fetches[0].url, /^https:\/\/prajandswosti\.com\/live\.json\?ts=/);
});

test('healthCheck emails once per problem kind and honours SITE_URL', () => {
  const b = seeded({ props: { GITHUB_TOKEN: 't', SITE_URL: 'https://example.org/' }, mailQuota: 3, fetch: () => ({ code: 404 }) });
  for (let i = 0; i < 5; i++) b.add('AuditLog', { Timestamp: new Date().toISOString(), Action: 'x.error', Details: 'boom ' + i });
  assert.strictEqual(b.ctx.healthCheck(), false);
  assert.strictEqual(b.mail.length, 1);
  const body = b.mail[0][2];
  assert.match(body, /Only 3 emails left/);
  assert.match(body, /5 errors in the last hour/);
  assert.match(body, /example\.org\/live\.json/);
  b.ctx.healthCheck();
  assert.strictEqual(b.mail.length, 1, 'no repeat email within 6h');
});

test('healthCheck reports an unreachable Drive folder', () => {
  const b = seeded();
  b.props.ROOT_FOLDER_ID = 'missing';
  assert.strictEqual(b.ctx.healthCheck(), false);
  assert.match(b.mail[0][2], /Drive folder unreachable/);
});
