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

export function createCloudSync({ client, store, getLocalPilot, applyRemotePilot, now = () => new Date().toISOString(), retries = 2, wait = async () => {} } = {}) {
  const result = (status, extra = {}) => ({ status, ...extra });
  const session = async () => sessionFrom(client);
  const active = () => serializePilot(getLocalPilot?.(), now());

  async function upload() {
    if (!client) return result('disabled');
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out');
    const local = active();
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
      const version = Number(metadata[local.localId]?.version || 0) + 1;
      const snapshotQuery = client.from('progress_snapshots').upsert({
        user_id: authSession.user.id,
        pilot_id: pilot.id,
        version,
        payload: local,
        updated_at: local.updatedAt,
      }, { onConflict: 'pilot_id' });
      const { error: snapshotError } = await snapshotQuery;
      if (snapshotError) throw snapshotError;
      writeMetadata(store, { ...metadata, [local.localId]: { version, updatedAt: local.updatedAt } });
      return result('uploaded', { version, updatedAt: local.updatedAt });
    }, retries, wait).catch(error => result('failed', { error }));
  }

  async function download() {
    if (!client) return result('disabled');
    const authSession = await session();
    if (!authSession?.user?.id) return result('signed-out');
    const local = active();
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
      if (decision?.source === 'remote') applyRemotePilot?.(decision.snapshot);
      return result(decision?.source === 'remote' ? 'downloaded' : 'local-newer', { snapshot: decision?.snapshot });
    }, retries, wait).catch(error => result('failed', { error }));
  }

  return { upload, download, sync: async () => { const pushed = await upload(); return pushed.status === 'uploaded' ? pushed : download(); } };
}

export { SYNC_METADATA_KEY };
