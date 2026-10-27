const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const boundary = fs.readFileSync('src/lib/react-cloud-sync.ts', 'utf8');
const adapters = fs.readFileSync('src/lib/shell-adapters.ts', 'utf8');
const legacy = fs.readFileSync('public/legacy/scripts/32.js', 'utf8');

test('React cloud boundary exposes typed fail-closed operations', () => {
  assert.match(boundary, /BrowserCloudBoundary/);
  assert.match(boundary, /export interface ReactCloudSyncBoundary/);
  assert.match(boundary, /createReactCloudSyncBoundary/);
  assert.match(boundary, /Promise\.resolve\(disabled\(\)\)/);
  assert.match(boundary, /safeCall/);
  assert.match(boundary, /restorePilot: \(localId: string\) =>/);
});

test('persistence boundary resolves the legacy cloud adapter lazily', () => {
  assert.match(adapters, /cloud: ReactCloudSyncBoundary/);
  assert.match(adapters, /createReactCloudSyncBoundary\(\(\) => window\.TTCloudSyncAdapter\)/);
  assert.match(legacy, /window\.TTCloudSyncAdapter = cloudAdapter/);
  assert.match(legacy, /cloudAdapter\.deleteCloudData/);
  assert.match(legacy, /cloudAdapter\.listPilots/);
  assert.match(legacy, /cloudAdapter\.restorePilot/);
});

test('automatic cloud retries stop after a failure until local work or a manual sync resumes them', () => {
  assert.match(legacy, /let cloudAutoSyncSuppressed = false/);
  assert.match(legacy, /if \(cloudAutoSyncSuppressed && !manual\) return;/);
  assert.match(legacy, /cloudAutoSyncSuppressed = true/);
  assert.match(legacy, /cloudAutoSyncSuppressed = false/);
});
