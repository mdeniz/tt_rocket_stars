import { createSupabaseCloudProvider } from './cloud-provider.js';

const SYNC_METADATA_KEY = 'tt-rocket-cloud-sync-v1';

const clone = value => JSON.parse(JSON.stringify(value ?? null));

function validateSnapshot(snapshot) {
  const validator = globalThis?.TTPersistenceContracts?.validateCloudSnapshot;
  if (typeof validator === 'function') {
    const result = validator(snapshot);
    if (!result.ok) {
      const error = new TypeError(result.error);
      error.noRetry = true;
      throw error;
    }
    return result.value;
  }
  if (!snapshot || typeof snapshot.localId !== 'string' || !snapshot.localId.trim() || typeof snapshot.name !== 'string' || !snapshot.payload || typeof snapshot.payload !== 'object' || Array.isArray(snapshot.payload) || !['en', 'es'].includes(snapshot.language) || typeof snapshot.updatedAt !== 'string') {
    const error = new TypeError('Cloud snapshot is invalid.');
    error.noRetry = true;
    throw error;
  }
  return snapshot;
}

export function serializePilot(profile, now = new Date().toISOString()) {
  if (!profile?.id) throw new TypeError('A pilot id is required.');
  return validateSnapshot({
    localId: String(profile.id),
    name: String(profile.name || 'Pilot').trim().slice(0, 80),
    avatar: profile.avatar || null,
    language: profile.language === 'en' ? 'en' : 'es',
    payload: clone(profile.payload || {}),
    updatedAt: profile.updatedAt || now,
  });
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

const cancelledError = () => Object.assign(new Error('Cloud synchronization was cancelled.'), { code: 'cancelled', noRetry: true });

async function retry(operation, retries, wait, isCancelled = () => false) {
  let attempt = 0;
  while (true) {
    try {
      if (isCancelled()) throw cancelledError();
      return await operation();
    } catch (error) {
      if (isCancelled() || error?.code === 'cancelled') throw cancelledError();
      if (error?.noRetry) throw error;
      if (attempt >= retries) throw error;
      attempt += 1;
      await wait(attempt, error);
      if (isCancelled()) throw cancelledError();
    }
  }
}

function readMetadata(store) {
  try { return JSON.parse(store?.getItem?.(SYNC_METADATA_KEY) || '{}') || {}; } catch { return {}; }
}

function writeMetadata(store, value) {
  try { store?.setItem?.(SYNC_METADATA_KEY, JSON.stringify(value)); } catch { /* local storage is optional */ }
}

export function createCloudSync({ client, provider = client ? createSupabaseCloudProvider(client) : null, store, getLocalPilot, applyRemotePilot, createRecoveryBackup, onConflict, now = () => new Date().toISOString(), retries = 2, wait = async () => {}, onStatus = () => {} } = {}) {
  const result = (status, extra = {}) => ({ status, ...extra });
  const report = (status, extra = {}) => { try { onStatus({ ...extra, status }); } catch { /* status reporting must never affect gameplay */ } };
  const session = async () => provider?.session?.() || null;
  const active = () => serializePilot(getLocalPilot?.(), now());
  let lifecycleGeneration = 0;
  const isCancelled = generation => generation !== lifecycleGeneration;

  const isConflictError = error => {
    const code = String(error?.code || error?.error?.code || '');
    const message = `${error?.message || ''} ${error?.error?.message || ''}`.toLowerCase();
    return code === '40001' || message.includes('snapshot version conflict');
  };
  const readRemoteSnapshot = async pilotId => {
    const remote = await provider.readSnapshot(pilotId);
    return remote ? { ...remote.payload, version: remote.version, updatedAt: remote.updated_at } : null;
  };
  const normalizeRemotePilot = (pilot, snapshot) => {
    const snapshotPayload = snapshot?.payload;
    return validateSnapshot({
      localId: String(pilot?.local_id || snapshotPayload?.localId || ''),
      name: String(pilot?.name || snapshotPayload?.name || 'Pilot').trim().slice(0, 80),
      avatar: pilot?.avatar || snapshotPayload?.avatar || null,
      language: pilot?.language === 'en' || snapshotPayload?.language === 'en' ? 'en' : 'es',
      payload: clone(snapshotPayload?.payload || pilot?.payload || {}),
      updatedAt: snapshot?.updated_at || pilot?.updated_at || new Date(0).toISOString(),
      version: Number(snapshot?.version || 0),
    });
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
    if (choice === 'local') return performUpload({ ...options, expectedVersion: Number(conflict.remote?.version || 0), skipConflictHandling: true });
    return conflict;
  }
  async function performUpload(options = {}, generation = lifecycleGeneration) {
    if (isCancelled(generation)) return result('cancelled');
    report('pending');
    if (!provider) { report('disabled'); return result('disabled'); }
    const authSession = await session();
    if (isCancelled(generation)) return result('cancelled');
    if (!authSession?.user?.id) { report('signed-out'); return result('signed-out'); }
    const local = active();
    report('syncing', { localId: local.localId });
    return retry(async () => {
      if (isCancelled(generation)) throw cancelledError();
      const pilot = await provider.upsertPilot(authSession, local);
      if (isCancelled(generation)) throw cancelledError();
      const metadata = readMetadata(store);
      const expectedVersion = options.expectedVersion === undefined
        ? Number(metadata[local.localId]?.version || 0)
        : Number(options.expectedVersion || 0);
      let version = expectedVersion + 1;
      try { version = await provider.writeSnapshot(authSession, pilot.id, expectedVersion, local); }
      catch (error) { if (isConflictError(error)) error.noRetry = true; throw error; }
      if (isCancelled(generation)) return result('cancelled');
      writeMetadata(store, { ...metadata, [local.localId]: { version, updatedAt: local.updatedAt } });
      const uploaded = result('uploaded', { version, updatedAt: local.updatedAt });
      report('synced', uploaded);
      return uploaded;
    }, retries, wait, () => isCancelled(generation)).catch(async error => {
      if (isCancelled(generation) || error?.code === 'cancelled') return result('cancelled');
      if (!options.skipConflictHandling && isConflictError(error)) {
        try {
          const remote = await readRemoteSnapshot(error.pilotId || await provider.findPilotId(local.localId));
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

  let activeUpload = null;
  let activeUploadToken = null;
  let uploadQueued = false;
  async function upload(options = {}) {
    if (activeUpload) {
      uploadQueued = true;
      return activeUpload;
    }
    const generation = lifecycleGeneration;
    const token = {};
    activeUploadToken = token;
    const pendingUpload = (async () => {
      let result;
      do {
        uploadQueued = false;
        result = await performUpload(options, generation);
      } while (uploadQueued && !isCancelled(generation));
      return result;
    })().finally(() => {
      if (activeUploadToken === token) {
        activeUpload = null;
        activeUploadToken = null;
      }
    });
    activeUpload = pendingUpload;
    return activeUpload;
  }

  function cancel() {
    lifecycleGeneration += 1;
    uploadQueued = false;
    if (queueTimer) clearTimeout(queueTimer);
    queueTimer = null;
    if (queuedResolve) queuedResolve(result('cancelled'));
    queuedResolve = null;
    provider?.cancelPending?.();
    activeUpload = null;
    activeUploadToken = null;
  }

  async function download() {
    report('pending');
    if (!provider) { report('disabled'); return result('disabled'); }
    const authSession = await session();
    if (!authSession?.user?.id) { report('signed-out'); return result('signed-out'); }
    const local = active();
    report('syncing', { localId: local.localId });
    return retry(async () => {
      const pilot = await provider.readPilot(authSession, local.localId);
      if (!pilot) return result('not-found');
      const remote = await provider.readPilotSnapshot(authSession, pilot.id);
      const remoteSnapshot = validateSnapshot(remote?.payload?.localId
        ? { ...remote.payload, updatedAt: remote.updated_at || remote.payload.updatedAt || pilot.updated_at, version: remote.version }
        : {
          localId: pilot.local_id || local.localId,
          name: pilot.name || local.name || 'Pilot',
          avatar: pilot.avatar || local.avatar,
          language: pilot.language || local.language || 'es',
          payload: pilot.payload || {},
          updatedAt: pilot.updated_at || new Date(0).toISOString(),
          version: remote?.version,
        });
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
    if (!provider) return result('disabled', { pilots: [] });
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out', { pilots: [] });
    try {
      const rows = await provider.listPilots(authSession);
      return result('listed', { pilots: rows.map(row => normalizeRemotePilot(row)) });
    } catch (error) {
      return result('failed', { pilots: [], error });
    }
  }

  async function downloadPilot(localId) {
    if (!provider) return result('disabled');
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out');
    if (!localId) return result('not-found');
    try {
      const pilot = await provider.readPilot(authSession, localId);
      if (!pilot) return result('not-found');
      const snapshot = await provider.readPilotSnapshot(authSession, pilot.id);
      return result('downloaded', { snapshot: normalizeRemotePilot(pilot, snapshot) });
    } catch (error) {
      return result('failed', { error });
    }
  }

  async function deleteCloudData() {
    if (!provider) return result('disabled');
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out');
    try {
      await provider.deleteCloudData(authSession);
      return result('deleted');
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
  return {
    cancel,
    upload,
    download,
    listPilots: listRemotePilots,
    restorePilot: downloadPilot,
    // Compatibility aliases remain available to older integrations while the
    // browser consumers move to the provider-neutral names above.
    listRemotePilots,
    downloadPilot,
    deleteCloudData,
    queueUpload,
    sync: async () => { const pushed = await upload(); return pushed.status === 'uploaded' ? pushed : download(); },
  };
}

export { SYNC_METADATA_KEY };
