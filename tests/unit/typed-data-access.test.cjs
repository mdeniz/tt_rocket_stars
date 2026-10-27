const assert = require('node:assert/strict');
const test = require('node:test');

const context = { userId: 'user-1', accessToken: 'user-token' };

function pilot(id = 'pilot-1') {
  return {
    id,
    userId: 'user-1',
    localId: 'local-1',
    name: 'Pilot',
    avatar: null,
    language: 'en',
    payload: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function snapshot() {
  return {
    id: 'snapshot-1',
    userId: 'user-1',
    pilotId: 'pilot-1',
    version: 2,
    payload: { progress: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:01.000Z',
  };
}

async function loadRepository() {
  return import('../../server/data-access/repository.ts');
}

function provider(overrides = {}) {
  const calls = [];
  const base = {
    upsertOwnedPilot: async (userId, value) => { calls.push(['upsertOwnedPilot', userId, value]); return pilot(); },
    listOwnedPilots: async userId => { calls.push(['listOwnedPilots', userId]); return [pilot()]; },
    readOwnedPilot: async (userId, localId) => { calls.push(['readOwnedPilot', userId, localId]); return pilot(); },
    readProgressSnapshot: async (userId, pilotId) => { calls.push(['readProgressSnapshot', userId, pilotId]); return snapshot(); },
    readGrantedPilot: async (userId, pilotId) => { calls.push(['readGrantedPilot', userId, pilotId]); return pilot(pilotId); },
    listCrewMemberships: async userId => { calls.push(['listCrewMemberships', userId]); return []; },
    listPilotAccess: async (userId, pilotId) => { calls.push(['listPilotAccess', userId, pilotId]); return []; },
    writeProgressSnapshot: async (userId, write) => { calls.push(['writeProgressSnapshot', userId, write]); return snapshot(); },
    deleteOwnedCloudData: async userId => { calls.push(['deleteOwnedCloudData', userId]); },
  };
  return { calls, value: { ...base, ...overrides } };
}

test('typed repository binds every operation to the authenticated user', async () => {
  const { createTypedDataAccess } = await loadRepository();
  const recorded = provider();
  const access = createTypedDataAccess(() => recorded.value);

  await access.listOwnedPilots(context);
  await access.readOwnedPilot(context, { localId: 'local-1' });
  await access.readGrantedPilot(context, 'pilot-1');
  await access.listCrewMemberships(context);
  await access.listPilotAccess(context, 'pilot-1');
  await access.writeProgressSnapshot(context, { pilotId: 'pilot-1', expectedVersion: 1, payload: {} });
  await access.deleteOwnedCloudData(context);

  assert.deepEqual(recorded.calls.map(call => call[1]), [
    'user-1', 'user-1', 'user-1', 'user-1', 'user-1', 'user-1', 'user-1',
  ]);
});

test('typed repository rejects missing authentication and malformed writes', async () => {
  const { createTypedDataAccess } = await loadRepository();
  const recorded = provider();
  const access = createTypedDataAccess(() => recorded.value);

  await assert.rejects(() => access.listOwnedPilots({ userId: '', accessToken: '' }), /authenticated request context/i);
  assert.throws(() => access.readOwnedPilot(context, { localId: '' }), /localId is required/i);
  assert.throws(() => access.writeProgressSnapshot(context, { pilotId: 'pilot-1', expectedVersion: -1, payload: {} }), /expectedVersion/i);
  assert.throws(() => access.writeProgressSnapshot(context, { pilotId: 'pilot-1', expectedVersion: 0, payload: null }), /payload object/i);
  assert.equal(recorded.calls.length, 0);
});

test('typed repository preserves conflicts and wraps provider failures', async () => {
  const { createTypedDataAccess } = await loadRepository();
  const { DataAccessError } = await import('../../server/data-access/contracts.ts');
  const conflict = new DataAccessError('conflict', 'snapshot version conflict');
  const recorded = provider({
    writeProgressSnapshot: async () => { throw conflict; },
    readOwnedPilot: async () => { throw new Error('database unavailable'); },
  });
  const access = createTypedDataAccess(() => recorded.value);

  await assert.rejects(
    () => access.writeProgressSnapshot(context, { pilotId: 'pilot-1', expectedVersion: 1, payload: {} }),
    error => error === conflict,
  );
  await assert.rejects(
    () => access.readOwnedPilot(context, { localId: 'local-1' }),
    error => error.code === 'provider-failure',
  );
});

test('typed repository source has no administrative credential path', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../../server/data-access/repository.ts'), 'utf8');
  assert.doesNotMatch(source, /service[_ -]?role|supabase_service_role|sb_secret/i);
  assert.doesNotMatch(source, /from ['"]@supabase\//i);
});
