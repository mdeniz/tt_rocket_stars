const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
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

test('snapshot RPC privilege repair restores only authenticated writes', () => {
  const migration = readFileSync(join(__dirname, '../../supabase/migrations/20261027120000_restore_snapshot_rpc_privileges.sql'), 'utf8');
  assert.match(migration, /grant insert, update on table public\.progress_snapshots to authenticated/i);
  assert.doesNotMatch(migration, /grant .*delete|to anon/i);
});
