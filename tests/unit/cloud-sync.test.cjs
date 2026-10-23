const test = require('node:test');
const assert = require('node:assert/strict');

const cloudSync = import('../../src/lib/cloud-sync.js');

test('serializes the existing pilot payload without changing its shape', async () => {
  const { serializePilot } = await cloudSync;
  const profile = { id: 'pilot-1', name: 'Ada', language: 'en', payload: { 'cosmotablas-v2': '{}' } };
  const snapshot = serializePilot(profile, '2026-01-01T00:00:00.000Z');
  assert.deepEqual(snapshot.payload, profile.payload);
  assert.equal(snapshot.localId, profile.id);
  assert.equal(snapshot.updatedAt, '2026-01-01T00:00:00.000Z');
});

test('resolves equal timestamps and versions deterministically', async () => {
  const { chooseSnapshot } = await cloudSync;
  const local = { updatedAt: '2026-01-01T00:00:00.000Z', version: 2, payload: { value: 'a' } };
  const remote = { updatedAt: local.updatedAt, version: 2, payload: { value: 'b' } };
  assert.equal(chooseSnapshot(local, remote).source, 'remote');
  assert.equal(chooseSnapshot(local, remote).snapshot.payload.value, 'b');
});

test('retries failed uploads and stores synchronization metadata', async () => {
  const { createCloudSync, SYNC_METADATA_KEY } = await cloudSync;
  let attempts = 0;
  const values = new Map();
  const store = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from(table) {
      if (table === 'pilots') return { upsert: () => ({ select: () => ({ single: async () => { if (++attempts === 1) return { error: Error('temporary') }; return { data: { id: 'pilot-remote' } }; } }) }) };
      return { upsert: () => ({ then: resolve => resolve({ error: null }) }) };
    },
  };
  const adapter = createCloudSync({ client, store, getLocalPilot: () => ({ id: 'pilot-1', name: 'Ada', payload: {} }) });
  const result = await adapter.upload();
  assert.equal(result.status, 'uploaded');
  assert.equal(attempts, 2);
  assert.ok(values.has(SYNC_METADATA_KEY));
});

test('is safe when cloud access is not configured', async () => {
  const { createCloudSync } = await cloudSync;
  const adapter = createCloudSync({ getLocalPilot: () => ({ id: 'pilot-1', name: 'Ada' }) });
  assert.equal((await adapter.upload()).status, 'disabled');
  assert.equal((await adapter.download()).status, 'disabled');
});
