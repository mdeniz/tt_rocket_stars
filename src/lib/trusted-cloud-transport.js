const MAX_RESPONSE_BYTES = 512 * 1024;

function normalizeFunctionUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

async function readJson(response) {
  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) throw Object.assign(new Error('Cloud response is too large.'), { code: 'invalid_response' });
  try { return text ? JSON.parse(text) : null; } catch { throw Object.assign(new Error('Cloud response is invalid.'), { code: 'invalid_response' }); }
}

export function createTrustedCloudProvider({ functionUrl, getSession = async () => null, fetchImpl = globalThis.fetch } = {}) {
  const endpoint = normalizeFunctionUrl(functionUrl);
  const cache = new Map();
  const request = async (operation, payload = {}) => {
    if (!endpoint || typeof fetchImpl !== 'function') throw Object.assign(new Error('Trusted cloud transport is unavailable.'), { code: 'unavailable' });
    const session = await getSession();
    if (!session?.access_token || !session?.user?.id) return null;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, ...payload }),
    });
    const body = await readJson(response);
    if (!response.ok) {
      const error = new Error(body?.message || 'Cloud operation failed.');
      error.code = body?.error || (response.status === 409 ? '40001' : 'cloud_unavailable');
      throw error;
    }
    return body;
  };

  return {
    session: getSession,
    async upsertPilot(_session, local) { return { id: local.localId }; },
    async writeSnapshot(_session, _pilotId, expectedVersion, local) {
      const result = await request('upload', { expectedVersion, pilot: local });
      return Number(result?.version || expectedVersion + 1);
    },
    async readPilot(_session, localId) {
      const result = await request('download', { localId });
      if (!result?.pilot) return null;
      cache.set(localId, result);
      return result.pilot;
    },
    async readPilotSnapshot(_session, pilotId) {
      for (const result of cache.values()) {
        if (result?.pilot?.id === pilotId || result?.pilot?.local_id === pilotId) return result.snapshot || null;
      }
      return null;
    },
    async listPilots() {
      const result = await request('listPilots');
      return Array.isArray(result?.pilots) ? result.pilots : [];
    },
    async findPilotId(localId) {
      const result = await request('download', { localId });
      if (!result?.pilot) return undefined;
      cache.set(localId, result);
      return result.pilot.id || result.pilot.local_id;
    },
    async readSnapshot(pilotId) { return this.readPilotSnapshot(null, pilotId); },
    async deleteCloudData() { await request('deleteCloudData'); },
  };
}

export { normalizeFunctionUrl };
