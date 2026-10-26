const assert = require('node:assert/strict');
const test = require('node:test');

const migrations = require('../../scripts/check-migrations.cjs');

test('migration manifest matches the ordered SQL history', () => {
  assert.doesNotThrow(() => migrations.checkMigrations());
});

test('migration validation rejects drifted metadata', () => {
  const actual = migrations.collectMigrations();
  const manifest = { migrations: actual.map(entry => ({ ...entry })) };
  manifest.migrations[0].sha256 = 'drifted';
  assert.throws(() => migrations.validateManifest(actual, manifest), /manifest does not match/i);
});
