const SYNC_METADATA_KEY = 'tt-rocket-cloud-sync-v1';

const clone = value => JSON.parse(JSON.stringify(value ?? null));

export function serializePilot(profile, now = new Date().toISOString()) {
  if (!profile?.id) throw new TypeError('A pilot id is required.');
  return {
    localId: String(profile.id),
    name: String(profile.name || 'Pilot').trim().slice(0, 80),
    avatar: profile.avatar || null,
    language: profile.language === 'en' ? 'en' : 'es',
    payload: clone(profile.payload || {}),
    updatedAt: profile.updatedAt || now,
  };
}

export function chooseSnapshot(localSnapshot, remoteSnapshot) {
  if (!localSnapshot) return remoteSnapshot ? { source: 'remote', snapshot: clone(remoteSnapshot) } : null;
  if (!remoteSnapshot) return { source: 'local', snapshot: clone(localSnapshot) };

  const localTime = Date.parse(localSnapshot.updatedAt || '') || 0;
  const remoteTime = Date.parse(remoteSnapshot.updatedAt || '') || 0;
  if (remoteTime !== localTime) {
    return remoteTime > localTime
      ? { source: 'remote', snapshot: clone(remoteSnapshot) }
      : { source: 'local', snapshot: clone(localSnapshot) };
  }
  const localVersion = Number(localSnapshot.version || 0);
  const remoteVersion = Number(remoteSnapshot.version || 0);
  if (remoteVersion !== localVersion) {
    return remoteVersion > localVersion
      ? { source: 'remote', snapshot: clone(remoteSnapshot) }
      : { source: 'local', snapshot: clone(localSnapshot) };
  }
  const localJson = JSON.stringify(localSnapshot);
  const remoteJson = JSON.stringify(remoteSnapshot);
  return remoteJson >= localJson
    ? { source: 'remote', snapshot: clone(remoteSnapshot) }
    : { source: 'local', snapshot: clone(localSnapshot) };
}

async function retry(operation, retries, wait) {
  let attempt = 0;
  while (true) {
    try { return await operation(); } catch (error) {
      if (error?.noRetry) throw error;
      if (attempt >= retries) throw error;
      attempt += 1;
      await wait(attempt, error);
    }
  }
}

function readMetadata(store) {
  try { return JSON.parse(store?.getItem?.(SYNC_METADATA_KEY) || '{}') || {}; } catch { return {}; }
}

function writeMetadata(store, value) {
  try { store?.setItem?.(SYNC_METADATA_KEY, JSON.stringify(value)); } catch { /* local storage is optional */ }
}

function sessionFrom(client) {
  return client?.auth?.getSession?.().then(result => result?.data?.session || null);
}

export function createCloudSync({ client, store, getLocalPilot, applyRemotePilot, createRecoveryBackup, onConflict, now = () => new Date().toISOString(), retries = 2, wait = async () => {}, onStatus = () => {} } = {}) {
  const result = (status, extra = {}) => ({ status, ...extra });
  const report = (status, extra = {}) => { try { onStatus({ ...extra, status }); } catch { /* status reporting must never affect gameplay */ } };
  const session = async () => sessionFrom(client);
  const active = () => serializePilot(getLocalPilot?.(), now());

  const isConflictError = error => {
    const code = String(error?.code || error?.error?.code || '');
    const message = `${error?.message || ''} ${error?.error?.message || ''}`.toLowerCase();
    return code === '40001' || message.includes('snapshot version conflict');
  };
  const readRemoteSnapshot = async pilotId => {
    const { data: remote, error } = await client.from('progress_snapshots')
      .select('version,payload,updated_at').eq('pilot_id', pilotId).maybeSingle();
    if (error) throw error;
    return remote ? { ...remote.payload, version: remote.version, updatedAt: remote.updated_at } : null;
  };
  const normalizeRemotePilot = (pilot, snapshot) => {
    const snapshotPayload = snapshot?.payload;
    return {
      localId: String(pilot?.local_id || snapshotPayload?.localId || ''),
      name: String(pilot?.name || snapshotPayload?.name || 'Pilot').trim().slice(0, 80),
      avatar: pilot?.avatar || snapshotPayload?.avatar || null,
      language: pilot?.language === 'en' || snapshotPayload?.language === 'en' ? 'en' : 'es',
      payload: clone(snapshotPayload?.payload || pilot?.payload || {}),
      updatedAt: snapshot?.updated_at || pilot?.updated_at || null,
      version: Number(snapshot?.version || 0),
    };
  };
  const writeVersion = (localId, snapshot) => {
    if (!snapshot) return;
    const metadata = readMetadata(store);
    writeMetadata(store, { ...metadata, [localId]: { version: Number(snapshot.version || 0), updatedAt: snapshot.updatedAt } });
  };
  async function resolveConflict(conflict, options = {}) {
    report('conflict', conflict);
    if (typeof onConflict !== 'function') return conflict;
    const choice = await onConflict(conflict);
    if (choice === 'remote') {
      const backedUp = typeof createRecoveryBackup !== 'function' || await createRecoveryBackup('Before cloud conflict restore');
      if (!backedUp) return result('failed', { error: new Error('Recovery backup failed.'), conflict });
      applyRemotePilot?.(conflict.remote);
      writeVersion(conflict.local.localId, conflict.remote);
      const resolved = result('resolved-remote', { conflict, snapshot: conflict.remote });
      report('synced', resolved);
      return resolved;
    }
    if (choice === 'local') return upload({ ...options, expectedVersion: Number(conflict.remote?.version || 0), skipConflictHandling: true });
    return conflict;
  }
  async function upload(options = {}) {
    report('pending');
    if (!client) { report('disabled'); return result('disabled'); }
    const authSession = await session();
    if (!authSession?.user?.id) { report('signed-out'); return result('signed-out'); }
    const local = active();
    report('syncing', { localId: local.localId });
    return retry(async () => {
      const pilotQuery = client.from('pilots').upsert({
        user_id: authSession.user.id,
        local_id: local.localId,
        name: local.name,
        avatar: local.avatar,
        language: local.language,
        payload: local.payload,
        updated_at: local.updatedAt,
      }, { onConflict: 'user_id,local_id' }).select('id').single();
      const { data: pilot, error: pilotError } = await pilotQuery;
      if (pilotError) throw pilotError;
      const metadata = readMetadata(store);
      const expectedVersion = options.expectedVersion === undefined
        ? Number(metadata[local.localId]?.version || 0)
        : Number(options.expectedVersion || 0);
      let version = expectedVersion + 1;
      if (typeof client.rpc === 'function') {
        const { data: snapshot, error: snapshotError } = await client.rpc('upsert_my_progress_snapshot', {
          p_pilot_id: pilot.id,
          p_expected_version: expectedVersion,
          p_payload: local,
        });
        if (snapshotError) {
          if (isConflictError(snapshotError)) snapshotError.noRetry = true;
          throw snapshotError;
        }
        version = Number(snapshot?.version || version);
      } else {
        const snapshotQuery = client.from('progress_snapshots').upsert({
          user_id: authSession.user.id,
          pilot_id: pilot.id,
          version,
          payload: local,
          updated_at: local.updatedAt,
        }, { onConflict: 'pilot_id' });
        const { error: snapshotError } = await snapshotQuery;
        if (snapshotError) throw snapshotError;
      }
      writeMetadata(store, { ...metadata, [local.localId]: { version, updatedAt: local.updatedAt } });
      const uploaded = result('uploaded', { version, updatedAt: local.updatedAt });
      report('synced', uploaded);
      return uploaded;
    }, retries, wait).catch(async error => {
      if (!options.skipConflictHandling && isConflictError(error)) {
        try {
          const remote = await readRemoteSnapshot(error.pilotId || (await client.from('pilots').select('id').eq('local_id', local.localId).maybeSingle())?.data?.id);
          if (remote) return resolveConflict(result('conflict', { local, remote, error }), options);
        } catch (remoteError) {
          const failed = result('failed', { error: remoteError });
          report('failed', failed);
          return failed;
        }
      }
      const failed = result('failed', { error }); report('failed', failed); return failed;
    });
  }

  async function download() {
    report('pending');
    if (!client) { report('disabled'); return result('disabled'); }
    const authSession = await session();
    if (!authSession?.user?.id) { report('signed-out'); return result('signed-out'); }
    const local = active();
    report('syncing', { localId: local.localId });
    return retry(async () => {
      const { data: pilot, error: pilotError } = await client.from('pilots')
        .select('id,payload,updated_at').eq('user_id', authSession.user.id)
        .eq('local_id', local.localId).maybeSingle();
      if (pilotError) throw pilotError;
      if (!pilot) return result('not-found');
      const { data: remote, error: snapshotError } = await client.from('progress_snapshots')
        .select('version,payload,updated_at').eq('user_id', authSession.user.id)
        .eq('pilot_id', pilot.id).maybeSingle();
      if (snapshotError) throw snapshotError;
      const remoteSnapshot = remote?.payload || { ...pilot.payload, updatedAt: pilot.updated_at, version: remote?.version };
      const decision = chooseSnapshot(local, remoteSnapshot);
      if (decision?.source === 'remote') {
        const backedUp = typeof createRecoveryBackup !== 'function' || await createRecoveryBackup('Before cloud restore');
        if (!backedUp) return result('failed', { error: new Error('Recovery backup failed.') });
        applyRemotePilot?.(decision.snapshot);
        writeVersion(local.localId, decision.snapshot);
      }
      const downloaded = result(decision?.source === 'remote' ? 'downloaded' : 'local-newer', { snapshot: decision?.snapshot });
      report('synced', downloaded);
      return downloaded;
    }, retries, wait).catch(error => { const failed = result('failed', { error }); report('failed', failed); return failed; });
  }

  async function listRemotePilots() {
    if (!client) return result('disabled', { pilots: [] });
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out', { pilots: [] });
    try {
      const query = client.from('pilots').select('local_id,name,avatar,language,payload,updated_at')
        .eq('user_id', authSession.user.id).limit(50);
      const response = typeof query.many === 'function' ? await query.many() : await query;
      if (response?.error) throw response.error;
      const rows = Array.isArray(response?.data) ? response.data : (response?.data ? [response.data] : []);
      return result('listed', { pilots: rows.map(row => normalizeRemotePilot(row)) });
    } catch (error) {
      return result('failed', { pilots: [], error });
    }
  }

  async function downloadPilot(localId) {
    if (!client) return result('disabled');
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out');
    if (!localId) return result('not-found');
    try {
      const { data: pilot, error: pilotError } = await client.from('pilots')
        .select('id,local_id,name,avatar,language,payload,updated_at').eq('user_id', authSession.user.id)
        .eq('local_id', localId).maybeSingle();
      if (pilotError) throw pilotError;
      if (!pilot) return result('not-found');
      const { data: snapshot, error: snapshotError } = await client.from('progress_snapshots')
        .select('version,payload,updated_at').eq('user_id', authSession.user.id)
        .eq('pilot_id', pilot.id).maybeSingle();
      if (snapshotError) throw snapshotError;
      return result('downloaded', { snapshot: normalizeRemotePilot(pilot, snapshot) });
    } catch (error) {
      return result('failed', { error });
    }
  }

  let queueTimer = null;
  let queuedResolve = null;
  const queueUpload = (delay = 1200) => new Promise(resolve => {
    if (queueTimer) clearTimeout(queueTimer);
    if (queuedResolve) queuedResolve(result('coalesced'));
    queuedResolve = resolve;
    report('pending');
    queueTimer = setTimeout(async () => {
      queueTimer = null;
      const currentResolve = queuedResolve;
      queuedResolve = null;
      currentResolve?.(await upload());
    }, Math.max(0, Number(delay) || 0));
  });
  return { upload, download, listRemotePilots, downloadPilot, queueUpload, sync: async () => { const pushed = await upload(); return pushed.status === 'uploaded' ? pushed : download(); } };
}

export { SYNC_METADATA_KEY };
