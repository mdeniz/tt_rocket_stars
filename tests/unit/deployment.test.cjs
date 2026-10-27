const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
const viteConfig = fs.readFileSync('vite.config.mjs', 'utf8');

test('Pages build passes the cloud access feature flag to Vite', () => {
  assert.match(pagesWorkflow, /VITE_ENABLE_CLOUD_ACCESS:\s*\$\{\{\s*vars\.VITE_ENABLE_CLOUD_ACCESS\s*\}\}/);
});

test('the direct browser fallback is opt-in and disabled by default', () => {
  assert.match(viteConfig, /VITE_ENABLE_LEGACY_CLOUD_DIRECT_FALLBACK/);
  assert.match(viteConfig, /legacyCloudDirectFallback: legacyCloudDirectFallbackEnabled/);
  assert.match(viteConfig, /let legacyCloudDirectFallbackEnabled = false/);
});

test('the trusted cloud transport is configured and disabled by default', () => {
  assert.match(pagesWorkflow, /VITE_TRUSTED_CLOUD_FUNCTION_URL/);
  assert.match(pagesWorkflow, /VITE_ENABLE_TRUSTED_CLOUD_TRANSPORT/);
  assert.match(viteConfig, /VITE_ENABLE_TRUSTED_CLOUD_TRANSPORT/);
  assert.match(viteConfig, /trustedCloudTransport: trustedCloudTransportEnabled/);
  assert.match(viteConfig, /let trustedCloudTransportEnabled = false/);
});
