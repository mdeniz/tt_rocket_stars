const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = path => fs.readFileSync(path, 'utf8');
const sync = read('src/lib/cloud-sync.js');
const provider = read('src/lib/cloud-provider.js');
const legacy = read('public/legacy/scripts/32.js');

test('the sync domain layer does not construct provider queries', () => {
  assert.doesNotMatch(sync, /\.from\s*\(/);
  assert.doesNotMatch(sync, /\.rpc\s*\(/);
  assert.match(provider, /\.from\s*\(/);
  assert.match(provider, /\.rpc\s*\(/);
});

test('legacy direct provider fallback is explicitly gated', () => {
  const fallbackGuard = 'legacyCloudDirectFallback';
  assert.match(legacy, /legacyCloudDirectFallback/);
  assert.ok(legacy.indexOf(fallbackGuard) < legacy.indexOf("rest('/pilots')"));
  assert.ok(legacy.indexOf(fallbackGuard) < legacy.indexOf("rest('/rpc/delete_my_cloud_data')"));
});

test('cloud consumers use domain operation names', () => {
  assert.match(legacy, /cloudAdapter\.listPilots\(\)/);
  assert.match(legacy, /cloudAdapter\.restorePilot\(pilot\.localId\)/);
  assert.match(legacy, /cloudAdapter\.deleteCloudData\(\)/);
});
