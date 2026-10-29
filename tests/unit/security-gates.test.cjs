const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { scanTrackedFiles } = require('../../scripts/check-secrets.cjs');

const allowlist = JSON.parse(readFileSync('.security/secret-scan-allowlist.json', 'utf8'));

test('tracked-file secret scan passes without printing values', () => {
  assert.deepEqual(scanTrackedFiles(), []);
});

test('allowlisted local defaults have an explicit reason', () => {
  for (const file of allowlist.files) {
    assert.match(allowlist.reasons[file] ?? '', /.+/);
  }
});
