const assert = require('node:assert/strict');
const test = require('node:test');

test('maps Postgres lock contention to a retryable data-access error', async () => {
  const { createSupabaseDataProvider } = await import('../../supabase/functions/_shared/supabase-data-provider.ts');
  const provider = createSupabaseDataProvider({
    rpc: async () => ({ data: null, error: { code: '55P03', message: 'cloud snapshot is busy' } }),
    from: () => { throw new Error('unexpected table access'); },
  }, { userId: 'user-1', accessToken: 'token' });

  await assert.rejects(
    () => provider.writeProgressSnapshot('user-1', { pilotId: 'pilot-1', expectedVersion: 2, payload: {} }),
    error => error.code === 'transient' && /temporarily busy/i.test(error.message),
  );
});

test('writes the pilot and snapshot through one atomic RPC', async () => {
  const { createSupabaseDataProvider } = await import('../../supabase/functions/_shared/supabase-data-provider.ts');
  const calls = [];
  const provider = createSupabaseDataProvider({
    rpc: async (name, args) => {
      calls.push({ name, args });
      return {
        data: {
          id: 'snapshot-1',
          user_id: 'user-1',
          pilot_id: 'pilot-1',
          version: 3,
          payload: { localId: 'local-1' },
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:01.000Z',
        },
        error: null,
      };
    },
    from: () => { throw new Error('unexpected table access'); },
  }, { userId: 'user-1', accessToken: 'token' });

  const result = await provider.writeOwnedPilotSnapshot('user-1', {
    localId: 'local-1',
    name: 'Pilot',
    avatar: null,
    language: 'en',
    payload: { progress: true },
    updatedAt: '2026-01-01T00:00:01.000Z',
  }, 2);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'upsert_my_pilot_and_progress_snapshot');
  assert.equal(calls[0].args.p_expected_version, 2);
  assert.deepEqual(calls[0].args.p_pilot_payload, { progress: true });
  assert.deepEqual(calls[0].args.p_snapshot_payload.localId, 'local-1');
  assert.equal(result.version, 3);
});
