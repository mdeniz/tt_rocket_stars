const assert = require('node:assert/strict');
const test = require('node:test');

const transport = import('../../src/lib/trusted-cloud-transport.js');
const cloudSync = import('../../src/lib/cloud-sync.js');

test('validates trusted function URLs', async () => {
  const { normalizeFunctionUrl } = await transport;
  assert.equal(normalizeFunctionUrl('https://example.supabase.co/functions/v1/trusted-cloud/'), 'https://example.supabase.co/functions/v1/trusted-cloud');
  assert.equal(normalizeFunctionUrl('http://localhost:54321/functions/v1/trusted-cloud'), 'http://localhost:54321/functions/v1/trusted-cloud');
  assert.equal(normalizeFunctionUrl('http://evil.example/function'), null);
});

test('sends only the bearer token and domain operation', async () => {
  const { createTrustedCloudProvider } = await transport;
  const calls = [];
  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.supabase.co/functions/v1/trusted-cloud',
    getSession: async () => ({ access_token: 'user-token', user: { id: 'user-1' } }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ status: 'listed', pilots: [] }), { status: 200 });
    },
  });
  assert.deepEqual(await provider.listPilots(), []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer user-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), { operation: 'listPilots' });
});

test('trusted browser source has no provider table or RPC construction', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../../src/lib/trusted-cloud-transport.js'), 'utf8');
  assert.doesNotMatch(source, /\.from\s*\(|\.rpc\s*\(|progress_snapshots|delete_my_cloud_data/);
  assert.match(source, /operation/);
});

test('maps conflict responses and keeps signed-out calls local', async () => {
  const { createTrustedCloudProvider } = await transport;
  let calls = 0;
  const signedOut = createTrustedCloudProvider({ functionUrl: 'https://example.com/function', getSession: async () => null, fetchImpl: async () => { calls += 1; } });
  assert.deepEqual(await signedOut.listPilots(), []);
  assert.equal(calls, 0);

  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.com/function',
    getSession: async () => ({ access_token: 'token', user: { id: 'user-1' } }),
    fetchImpl: async () => new Response(JSON.stringify({ error: 'conflict', message: 'The cloud snapshot has changed.' }), { status: 409 }),
  });
  await assert.rejects(() => provider.writeSnapshot(null, 'pilot-1', 2, { localId: 'pilot-1', payload: {} }), error => error.code === 'conflict');
});

test('maps a busy cloud response to a retryable transport error', async () => {
  const { createTrustedCloudProvider } = await transport;
  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.com/function',
    getSession: async () => ({ access_token: 'token', user: { id: 'user-1' } }),
    fetchImpl: async () => new Response(JSON.stringify({ error: 'cloud_busy', message: 'Cloud operation is busy. Try again shortly.' }), { status: 503 }),
  });

  await assert.rejects(
    () => provider.writeSnapshot(null, 'pilot-1', 2, { localId: 'pilot-1', payload: {} }),
    error => error.code === 'cloud_busy',
  );
});

test('bounds a trusted request that never resolves', async () => {
  const { createTrustedCloudProvider } = await transport;
  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.com/function',
    requestTimeoutMs: 10,
    getSession: async () => ({ access_token: 'token', user: { id: 'user-1' } }),
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
    }),
  });

  await assert.rejects(() => provider.listPilots(), error => error.code === 'timeout');
});

test('cancels active trusted requests when the session lifecycle ends', async () => {
  const { createTrustedCloudProvider } = await transport;
  let aborted = false;
  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.com/function',
    getSession: async () => ({ access_token: 'token', user: { id: 'user-1' } }),
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        aborted = true;
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      }, { once: true });
    }),
  });

  const request = provider.listPilots();
  await new Promise(resolve => setImmediate(resolve));
  provider.cancelPending();

  await assert.rejects(request, error => error.code === 'cancelled');
  assert.equal(aborted, true);
});

test('runs the cloud-sync contract through the trusted provider', async () => {
  const [{ createTrustedCloudProvider }, { createCloudSync }] = await Promise.all([transport, cloudSync]);
  const calls = [];
  const remotePilot = {
    id: 'remote-pilot-1',
    local_id: 'pilot-1',
    name: 'Ada',
    avatar: null,
    language: 'en',
    payload: {},
    updated_at: '2026-01-02T00:00:00.000Z',
  };
  const remoteSnapshot = {
    pilot_id: 'remote-pilot-1',
    version: 2,
    payload: { localId: 'pilot-1', name: 'Ada', language: 'en', payload: { score: 8 }, updatedAt: '2026-01-02T00:00:00.000Z' },
    updated_at: '2026-01-02T00:00:00.000Z',
  };
  const provider = createTrustedCloudProvider({
    functionUrl: 'https://example.com/function',
    getSession: async () => ({ access_token: 'token', user: { id: 'user-1' } }),
    fetchImpl: async (_url, options) => {
      const request = JSON.parse(options.body);
      calls.push(request);
      if (request.operation === 'upload') return new Response(JSON.stringify({ status: 'uploaded', version: 1 }), { status: 200 });
      if (request.operation === 'download') return new Response(JSON.stringify({ status: 'downloaded', pilot: remotePilot, snapshot: remoteSnapshot }), { status: 200 });
      if (request.operation === 'listPilots') return new Response(JSON.stringify({ status: 'listed', pilots: [remotePilot] }), { status: 200 });
      if (request.operation === 'deleteCloudData') return new Response(JSON.stringify({ status: 'deleted' }), { status: 200 });
      return new Response(JSON.stringify({ error: 'invalid_operation' }), { status: 400 });
    },
  });
  let local = { id: 'pilot-1', name: 'Ada', language: 'en', payload: { score: 1 }, updatedAt: '2026-01-01T00:00:00.000Z' };
  let applied = null;
  const store = new Map();
  const adapter = createCloudSync({
    provider,
    store: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    getLocalPilot: () => local,
    applyRemotePilot: snapshot => { applied = snapshot; },
    createRecoveryBackup: async () => true,
    retries: 0,
  });

  assert.equal((await adapter.upload()).status, 'uploaded');
  assert.equal((await adapter.listPilots()).status, 'listed');
  assert.equal((await adapter.download()).status, 'downloaded');
  assert.equal(applied.payload.score, 8);
  assert.equal((await adapter.deleteCloudData()).status, 'deleted');
  assert.deepEqual(calls.map(call => call.operation), ['upload', 'listPilots', 'download', 'deleteCloudData']);
  assert.equal(local.payload.score, 1);
});
