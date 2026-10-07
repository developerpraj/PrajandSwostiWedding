// Coverage report settings shared by the browser (Playwright) and backend (node --test) suites.
const path = require('path');

module.exports = {
  name: 'Wedding app coverage',
  outputDir: path.resolve(__dirname, 'coverage'),
  reports: ['v8', 'console-summary', 'json-summary'],
  entryFilter: entry => /\/(js|demo-data|apps-script)\/[^/]+\.(js|gs)$/.test(entry.url) || /\/(index|register|photos|ceremony|gift|games|pass|memorial|signin|slideshow|whisper|planner|nametags)\.html$/.test(entry.url) || /\/sw\.js$/.test(entry.url),
  sourceFilter: p => !/node_modules|tests\//.test(p)
};
