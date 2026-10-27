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

test('deletes cloud data through the domain adapter without touching local storage', async () => {
  const { createCloudSync } = await cloudSync;
  let rpcName = '';
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    rpc: async name => { rpcName = name; return { data: null, error: null }; },
  };
  const adapter = createCloudSync({ client });
  assert.equal((await adapter.deleteCloudData()).status, 'deleted');
  assert.equal(rpcName, 'delete_my_cloud_data');
});

test('runs upload and download through a provider-neutral in-memory contract', async () => {
  const { createCloudSync } = await cloudSync;
  const session = { user: { id: 'user-1' } };
  const pilots = new Map();
  const snapshots = new Map();
  const provider = {
    session: async () => session,
    upsertPilot: async (_session, local) => {
      const pilot = { id: `remote-${local.localId}`, ...local };
      pilots.set(local.localId, pilot);
      return pilot;
    },
    writeSnapshot: async (_session, pilotId, expectedVersion, local) => {
      const version = expectedVersion + 1;
      snapshots.set(pilotId, { version, payload: local, updated_at: local.updatedAt });
      return version;
    },
    readPilot: async (_session, localId) => pilots.get(localId) || null,
    readPilotSnapshot: async (_session, pilotId) => snapshots.get(pilotId) || null,
    listPilots: async () => [...pilots.values()],
    readSnapshot: async pilotId => snapshots.get(pilotId) || null,
    findPilotId: async localId => pilots.get(localId)?.id,
    deleteCloudData: async () => { pilots.clear(); snapshots.clear(); },
  };
  let local = { id: 'pilot-1', name: 'Ada', language: 'en', payload: { score: 4 }, updatedAt: '2026-01-02T00:00:00.000Z' };
  const adapter = createCloudSync({ provider, getLocalPilot: () => local });
  assert.equal((await adapter.upload()).status, 'uploaded');
  local = { ...local, payload: { score: 1 }, updatedAt: '2026-01-01T00:00:00.000Z' };
  let applied;
  const restoring = createCloudSync({ provider, getLocalPilot: () => local, applyRemotePilot: snapshot => { applied = snapshot; } });
  assert.equal((await restoring.download()).status, 'downloaded');
  assert.equal(applied.payload.score, 4);
});

test('does not touch cloud storage while signed out', async () => {
  const { createCloudSync } = await cloudSync;
  let cloudCalls = 0;
  const client = {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => { cloudCalls += 1; throw new Error('cloud access must be short-circuited'); },
  };
  const adapter = createCloudSync({ client, getLocalPilot: () => ({ id: 'pilot-1' }) });

  assert.equal((await adapter.upload()).status, 'signed-out');
  assert.equal((await adapter.download()).status, 'signed-out');
  assert.equal(cloudCalls, 0);
});

test('returns not-found without replacing the local pilot', async () => {
  const { createCloudSync } = await cloudSync;
  let applied = false;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    }),
  };
  const adapter = createCloudSync({
    client,
    getLocalPilot: () => ({ id: 'pilot-1', updatedAt: '2026-01-02T00:00:00.000Z' }),
    applyRemotePilot: () => { applied = true; },
  });

  assert.equal((await adapter.download()).status, 'not-found');
  assert.equal(applied, false);
});

test('lists and downloads only the authenticated account pilots', async () => {
  const { createCloudSync } = await cloudSync;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from(table) {
      if (table === 'pilots') return {
        select: () => ({
          eq: () => ({
            limit: async () => ({ data: [{ local_id: 'cloud-1', name: 'Remote Ada', language: 'en', payload: { 'cosmotablas-v2': '{}' } }], error: null }),
            eq: () => ({ maybeSingle: async () => ({ data: { id: 'remote-row', local_id: 'cloud-1', name: 'Remote Ada', language: 'en', payload: {}, updated_at: '2026-01-03T00:00:00.000Z' }, error: null }) }),
          }),
        }),
      };
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { version: 7, payload: { localId: 'cloud-1', payload: { score: 12 }, language: 'en' }, updated_at: '2026-01-03T00:00:00.000Z' }, error: null }) }) }) }) };
    },
  };
  const adapter = createCloudSync({ client });
  const listed = await adapter.listRemotePilots();
  assert.equal(listed.status, 'listed');
  assert.deepEqual(listed.pilots.map(pilot => pilot.localId), ['cloud-1']);
  const downloaded = await adapter.downloadPilot('cloud-1');
  assert.equal(downloaded.status, 'downloaded');
  assert.equal(downloaded.snapshot.localId, 'cloud-1');
  assert.equal(downloaded.snapshot.version, 7);
  assert.equal(downloaded.snapshot.payload.score, 12);
});

test('keeps the local pilot when a remote download repeatedly fails', async () => {
  const { createCloudSync } = await cloudSync;
  let attempts = 0;
  let applied = false;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => {
            attempts += 1;
            return { data: null, error: Error('offline') };
          } }),
        }),
      }),
    }),
  };
  const adapter = createCloudSync({
    client,
    retries: 2,
    getLocalPilot: () => ({ id: 'pilot-1' }),
    applyRemotePilot: () => { applied = true; },
  });

  const result = await adapter.download();
  assert.equal(result.status, 'failed');
  assert.equal(attempts, 3);
  assert.equal(applied, false);
});

test('does not overwrite a newer local snapshot', async () => {
  const { createCloudSync } = await cloudSync;
  let applied = false;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({
            data: { id: 'pilot-remote', payload: { score: 1 }, updated_at: '2026-01-01T00:00:00.000Z' },
            error: null,
          }) }),
        }),
      }),
    }),
  };
  const adapter = createCloudSync({
    client,
    getLocalPilot: () => ({ id: 'pilot-1', updatedAt: '2026-01-02T00:00:00.000Z', payload: { score: 2 } }),
    applyRemotePilot: () => { applied = true; },
  });

  assert.equal((await adapter.download()).status, 'local-newer');
  assert.equal(applied, false);
});

test('rejects malformed remote snapshots without replacing local state', async () => {
  const { createCloudSync } = await cloudSync;
  let applied = false;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({
            data: { id: 'pilot-remote', local_id: 'pilot-1', name: 'Remote', language: 'xx', payload: { score: 9 }, updated_at: '2026-01-03T00:00:00.000Z' },
            error: null,
          }) }),
        }),
      }),
    }),
  };
  const adapter = createCloudSync({
    client,
    getLocalPilot: () => ({ id: 'pilot-1', name: 'Local', language: 'en', updatedAt: '2026-01-02T00:00:00.000Z', payload: { score: 2 } }),
    applyRemotePilot: () => { applied = true; },
  });

  const result = await adapter.download();
  assert.equal(result.status, 'failed');
  assert.equal(applied, false);
});

test('coalesces queued uploads and reports bounded lifecycle states', async () => {
  const { createCloudSync } = await cloudSync;
  const statuses = [];
  let uploads = 0;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => ({
      upsert: () => ({ select: () => ({ single: async () => ({ data: { id: `pilot-${++uploads}` }, error: null }) }) }),
    }),
    rpc: async () => ({ data: { version: uploads }, error: null }),
  };
  const adapter = createCloudSync({
    client,
    getLocalPilot: () => ({ id: 'pilot-1', name: 'Ada', payload: {} }),
    onStatus: event => statuses.push(event.status),
  });
  const first = adapter.queueUpload(0);
  const second = adapter.queueUpload(0);
  assert.equal((await first).status, 'coalesced');
  assert.equal((await second).status, 'uploaded');
  assert.equal(uploads, 1);
  assert.deepEqual(statuses, ['pending', 'pending', 'pending', 'syncing', 'synced']);
});

test('serializes direct and queued uploads while preserving the latest pending write', async () => {
  const { createCloudSync } = await cloudSync;
  let uploads = 0;
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const provider = {
    session: async () => ({ user: { id: 'user-1' } }),
    upsertPilot: async (_session, local) => ({ id: `pilot-${local.payload.score}` }),
    writeSnapshot: async () => {
      uploads += 1;
      if (uploads === 1) await blocked;
      return uploads;
    },
  };
  let local = { id: 'pilot-1', name: 'Ada', language: 'en', payload: { score: 1 }, updatedAt: '2026-01-01T00:00:00.000Z' };
  const adapter = createCloudSync({ provider, getLocalPilot: () => local });
  const first = adapter.upload();
  await new Promise(resolve => setImmediate(resolve));
  local = { ...local, payload: { score: 2 }, updatedAt: '2026-01-02T00:00:00.000Z' };
  const second = adapter.queueUpload(0);
  release();
  await Promise.all([first, second]);
  assert.equal(uploads, 2);
});

test('surfaces a stale write with the current remote snapshot instead of overwriting it', async () => {
  const { createCloudSync } = await cloudSync;
  let rpcCalls = 0;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from(table) {
      if (table === 'pilots') return {
        upsert: () => ({ select: () => ({ single: async () => ({ data: { id: 'pilot-remote' }, error: null }) }) }),
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'pilot-remote' }, error: null }) }) }),
      };
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { version: 4, payload: { localId: 'pilot-1', payload: { score: 9 } }, updated_at: '2026-01-03T00:00:00.000Z' }, error: null }) }) }) };
    },
    rpc: async () => rpcCalls++ === 0
      ? { data: null, error: { code: '40001', message: 'snapshot version conflict' } }
      : { data: { version: 5 }, error: null },
  };
  const adapter = createCloudSync({ client, getLocalPilot: () => ({ id: 'pilot-1', payload: { score: 10 } }) });
  const result = await adapter.upload();
  assert.equal(result.status, 'conflict');
  assert.equal(result.remote.version, 4);
  assert.equal(result.remote.payload.score, 9);
  assert.equal(rpcCalls, 1);
});

test('restores a conflict choice only after creating a recovery backup', async () => {
  const { createCloudSync } = await cloudSync;
  const applied = [];
  const backups = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from(table) {
      if (table === 'pilots') return {
        upsert: () => ({ select: () => ({ single: async () => ({ data: { id: 'pilot-remote' }, error: null }) }) }),
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'pilot-remote' }, error: null }) }) }),
      };
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { version: 4, payload: { localId: 'pilot-1', payload: { score: 9 } }, updated_at: '2026-01-03T00:00:00.000Z' }, error: null }) }) }) };
    },
    rpc: async () => ({ data: null, error: { code: '40001', message: 'snapshot version conflict' } }),
  };
  const adapter = createCloudSync({
    client,
    getLocalPilot: () => ({ id: 'pilot-1', payload: { score: 10 } }),
    createRecoveryBackup: async reason => { backups.push(reason); return true; },
    applyRemotePilot: snapshot => applied.push(snapshot),
    onConflict: async () => 'remote',
  });
  const result = await adapter.upload();
  assert.equal(result.status, 'resolved-remote');
  assert.deepEqual(backups, ['Before cloud conflict restore']);
  assert.equal(applied[0].payload.score, 9);
});
