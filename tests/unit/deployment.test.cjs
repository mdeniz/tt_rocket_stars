const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');

test('Pages build passes the cloud access feature flag to Vite', () => {
  assert.match(pagesWorkflow, /VITE_ENABLE_CLOUD_ACCESS:\s*\$\{\{\s*vars\.VITE_ENABLE_CLOUD_ACCESS\s*\}\}/);
});
