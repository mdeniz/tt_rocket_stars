const assert = require('node:assert/strict');
const test = require('node:test');

const context = { userId: 'user-1', accessToken: 'token-1' };

const emptyPilotRow = {
  id: null,
  user_id: null,
  local_id: null,
  name: null,
  avatar: null,
  language: null,
  payload: null,
  created_at: null,
  updated_at: null,
  management_mode: null,
};

const emptySnapshotRow = {
  id: null,
  user_id: null,
  pilot_id: null,
  version: null,
  payload: null,
  created_at: null,
  updated_at: null,
};

test('maps all-null PostgREST composite sentinels to ownership-safe absence', async () => {
  const { createSupabaseDataProvider } = await import('../../supabase/functions/_shared/supabase-data-provider.ts');
  const provider = createSupabaseDataProvider({
    rpc: async name => ({
      data: name === 'read_my_pilot' ? emptyPilotRow : emptySnapshotRow,
      error: null,
    }),
  }, context);

  assert.equal(await provider.readOwnedPilot(context.userId, 'missing-local-id'), null);
  assert.equal(await provider.readProgressSnapshot(context.userId, 'missing-pilot-id'), null);
});

test('preserves populated provider rows', async () => {
  const { createSupabaseDataProvider } = await import('../../supabase/functions/_shared/supabase-data-provider.ts');
  const provider = createSupabaseDataProvider({
    rpc: async name => ({
      data: name === 'read_my_pilot'
        ? { ...emptyPilotRow, id: 'pilot-1', user_id: 'user-1', local_id: 'local-1', name: 'Pilot', language: 'en', payload: {}, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }
        : { ...emptySnapshotRow, id: 'snapshot-1', user_id: 'user-1', pilot_id: 'pilot-1', version: 1, payload: {}, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    }),
  }, context);

  assert.equal((await provider.readOwnedPilot(context.userId, 'local-1')).id, 'pilot-1');
  assert.equal((await provider.readProgressSnapshot(context.userId, 'pilot-1')).version, 1);
});
