const { defineConfig } = require('@playwright/test');
const PORT = Number(process.env.PORT || 8080);

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  globalTeardown: require.resolve('./e2e/coverage-teardown.js'),
  use: {
    baseURL: 'http://127.0.0.1:' + PORT + '/',
    channel: 'chrome',
    headless: true,
    serviceWorkers: 'block',
    trace: 'off'
  },
  webServer: {
    command: JSON.stringify(process.execPath) + ' server.js',
    url: 'http://127.0.0.1:' + PORT + '/index.html',
    env: { PORT: String(PORT) },
    reuseExistingServer: true,
    timeout: 15000
  }
});
