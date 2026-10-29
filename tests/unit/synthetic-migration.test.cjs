const assert = require('node:assert/strict');
const test = require('node:test');

async function load() { return import('../../apps/api/src/migration/synthetic.ts'); }

function fixture(extra = {}) {
  return {
    source: 'supabase-synthetic-v1',
    accounts: [{ id: 'legacy-account-a', email: 'pilot-a@example.test', displayName: 'Pilot A' }],
    pilots: [{ id: 'legacy-pilot-a', accountId: 'legacy-account-a', localId: 'pilot-a', name: 'Pilot A', avatar: 'rocket', payload: { coins: 4 } }],
    progressSnapshots: [{ id: 'legacy-snapshot-a', accountId: 'legacy-account-a', pilotId: 'legacy-pilot-a', version: 2, payload: { missions: 3 } }],
    crews: [{ id: 'legacy-crew-a', ownerAccountId: 'legacy-account-a', name: 'Crew A' }],
    crewMemberships: [{ crewId: 'legacy-crew-a', accountId: 'legacy-account-a', role: 'owner' }],
    pilotAccess: [{ pilotId: 'legacy-pilot-a', accountId: 'legacy-account-a', grantedByAccountId: 'legacy-account-a' }],
    ...extra,
  };
}

test('synthetic export is deterministic and includes counts/checksums', async () => {
  const { exportSyntheticBundle, packageSha256 } = await load();
  const first = await exportSyntheticBundle(fixture());
  const second = await exportSyntheticBundle(fixture(), '2099-01-01T00:00:00.000Z');
  assert.deepEqual(first.idMap, second.idMap);
  assert.deepEqual(first.tables, second.tables);
  assert.equal(first.manifest.counts.accounts, 1);
  assert.equal(await packageSha256(first), first.manifest.packageSha256);
});

test('export rejects secret-shaped or unknown source fields', async () => {
  const { exportSyntheticBundle } = await load();
  await assert.rejects(() => exportSyntheticBundle(fixture({ accounts: [{ id: 'a', password: 'never-export' }] })), /disallowed field/i);
  await assert.rejects(() => exportSyntheticBundle(fixture({ progressSnapshots: [{ id: 's', accountId: 'missing', pilotId: 'legacy-pilot-a', version: 1, payload: {} }] })), /unknown owner/i);
});

test('package validation detects tampering without exposing payload values', async () => {
  const { exportSyntheticBundle, validateMigrationPackage } = await load();
  const migration = await exportSyntheticBundle(fixture());
  migration.tables.accounts[0].email = 'changed@example.test';
  await assert.rejects(() => validateMigrationPackage(migration), /checksum/i);
  assert.equal(JSON.stringify(migration).includes('never-export'), false);
});

test('dry-run and replay are explicit importer outcomes', async () => {
  const { exportSyntheticBundle, importMigrationPackage } = await load();
  const migration = await exportSyntheticBundle(fixture());
  const dryRun = await importMigrationPackage(null, migration, { dryRun: true });
  assert.equal(dryRun.status, 'dry-run');
  const calls = [];
  const sql = { begin: async callback => callback(async (strings, ...values) => { calls.push({ strings, values }); return []; }) };
  const imported = await importMigrationPackage(sql, migration);
  assert.equal(imported.status, 'imported');
});
