// One-click pipeline: generate seed -> start static server on 8080 -> wait -> playwright -> always stop server.
// Usage (from tests/): npm run test:full [-- extra playwright args]
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const dir = __dirname;
let server;

function stop() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill('SIGTERM');
}
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { stop(); process.exit(130); }));
process.on('exit', stop);

function waitForServer(timeoutMs) {
  const end = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function ping() {
      http.get({ host: '127.0.0.1', port: PORT, path: '/index.html', timeout: 1000 }, res => { res.resume(); res.statusCode === 200 ? resolve() : retry(); })
        .on('error', retry).on('timeout', function () { this.destroy(); });
      function retry() { Date.now() > end ? reject(new Error('Server did not start on port ' + PORT)) : setTimeout(ping, 200); }
    })();
  });
}

(async () => {
  let code = 1;
  try {
    console.log('> 1/4 generating seed data');
    const gen = spawnSync(process.execPath, [path.join(dir, 'generateMockData.js')], { stdio: 'inherit' });
    if (gen.status !== 0) throw new Error('generateMockData.js failed');

    console.log('> 2/4 starting server on ' + PORT);
    server = spawn(process.execPath, [path.join(dir, 'server.js')], { cwd: dir, env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'inherit' });
    server.on('exit', c => { if (c) console.error('server exited with ' + c); });

    console.log('> 3/4 waiting for server');
    await waitForServer(15000);

    console.log('> 4/4 running playwright');
    const cli = require.resolve('@playwright/test/cli', { paths: [dir] });
    const pw = spawnSync(process.execPath, [cli, 'test'].concat(process.argv.slice(2)), {
      cwd: dir, stdio: 'inherit', env: Object.assign({}, process.env, { PORT: String(PORT) })
    });
    code = pw.status === null ? 1 : pw.status;
  } catch (e) {
    console.error(e.message);
  } finally {
    stop();
    console.log('> server stopped; exit code ' + code);
  }
  process.exit(code);
})();
