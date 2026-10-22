const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const release = import('../../scripts/release.mjs');

test('calculates the next semantic version', async () => {
  const { nextVersion } = await release;
  assert.equal(nextVersion('0.1.0', 'patch'), '0.1.1');
  assert.equal(nextVersion('0.1.0', 'minor'), '0.2.0');
  assert.equal(nextVersion('0.1.0', 'major'), '1.0.0');
  assert.equal(nextVersion('0.1.0', '2.3.4'), '2.3.4');
});

test('rejects invalid or non-increasing release versions', async () => {
  const { nextVersion } = await release;
  assert.throws(() => nextVersion('0.1.0', '0.1.0'), /greater than the current version/);
  assert.throws(() => nextVersion('0.1.0', '1.0'), /SemVer/);
  assert.throws(() => nextVersion('0.1.0', 'prepatch'), /patch, minor, major/);
});

test('CLI rejects an invalid release selector', () => {
  const result = spawnSync(process.execPath, [join(__dirname, '../../scripts/release.mjs'), 'invalid'], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /patch, minor, major/);
});
