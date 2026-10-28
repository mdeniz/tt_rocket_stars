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
