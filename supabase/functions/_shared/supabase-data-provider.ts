import { DataAccessError, type AuthenticatedRequestContext, type CrewMembershipRecord, type PilotAccessGrant, type PilotRecord, type PilotWrite, type ProgressSnapshotRecord, type SnapshotWrite } from '../../../server/data-access/contracts.ts';
import type { DataAccessProvider } from '../../../server/data-access/provider.ts';

type SupabaseClient = {
  from: (table: string) => any;
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>;
};

function mapPilot(row: any): PilotRecord {
  return {
    id: row.id,
    userId: row.user_id,
    localId: row.local_id,
    name: row.name,
    avatar: row.avatar ?? null,
    language: row.language,
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSnapshot(row: any): ProgressSnapshotRecord {
  return {
    id: row.id,
    userId: row.user_id,
    pilotId: row.pilot_id,
    version: Number(row.version),
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function providerError(error: any): DataAccessError {
  const code = String(error?.code || '');
  if (code === '40001' || String(error?.message || '').toLowerCase().includes('snapshot version conflict')) {
    return new DataAccessError('conflict', 'The cloud snapshot has changed.');
  }
  if (code === '55P03' || String(error?.message || '').toLowerCase().includes('cloud snapshot is busy')) {
    return new DataAccessError('transient', 'The cloud snapshot is temporarily busy.');
  }
  if (code === '42501' || code === 'PGRST116') return new DataAccessError('unauthorized', 'The cloud operation is not authorized.');
  return new DataAccessError('provider-failure', 'The data provider operation failed.');
}

async function single<T>(query: Promise<{ data: T | null; error: any }>): Promise<T | null> {
  const result = await query;
  if (result.error) throw providerError(result.error);
  // PostgREST serializes a zero-row SQL function returning a composite type
  // as one object whose fields are all null. Treat that sentinel as no row so
  // ownership-safe downloads return `not-found` instead of a provider error.
  if (isEmptyCompositeRow(result.data)) return null;
  return result.data;
}

function isEmptyCompositeRow(value: unknown): value is Record<string, null> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const values = Object.values(value);
  return values.length > 0 && values.every(entry => entry === null);
}

export function createSupabaseDataProvider(client: SupabaseClient, _context: AuthenticatedRequestContext): DataAccessProvider {
  return {
    async upsertOwnedPilot(userId: string, pilot: PilotWrite) {
      const row = await single(client.rpc('upsert_my_pilot', {
        p_local_id: pilot.localId,
        p_name: pilot.name,
        p_avatar: pilot.avatar,
        p_language: pilot.language,
        p_payload: pilot.payload,
        p_updated_at: pilot.updatedAt,
      }));
      if (!row) throw new DataAccessError('provider-failure', 'The pilot could not be stored.');
      return mapPilot(row);
    },

    async listOwnedPilots(userId: string) {
      const result = await client.rpc('list_my_pilots', {});
      if (result.error) throw providerError(result.error);
      return (result.data || []).map(mapPilot);
    },

    async readOwnedPilot(userId: string, localId: string) {
      const row = await single(client.rpc('read_my_pilot', { p_local_id: localId }));
      return row ? mapPilot(row) : null;
    },

    async readProgressSnapshot(userId: string, pilotId: string) {
      const row = await single(client.rpc('read_my_progress_snapshot', { p_pilot_id: pilotId }));
      return row ? mapSnapshot(row) : null;
    },

    async readGrantedPilot(userId: string, pilotId: string) {
      const row = await single(client.from('pilots').select('*').eq('user_id', userId).eq('id', pilotId).maybeSingle());
      return row ? mapPilot(row) : null;
    },

    async listCrewMemberships(_userId: string): Promise<readonly CrewMembershipRecord[]> {
      return [];
    },

    async listPilotAccess(_userId: string, _pilotId: string): Promise<readonly PilotAccessGrant[]> {
      return [];
    },

    async writeProgressSnapshot(userId: string, write: SnapshotWrite) {
      const result = await client.rpc('upsert_my_progress_snapshot', {
        p_pilot_id: write.pilotId,
        p_expected_version: write.expectedVersion,
        p_payload: write.payload,
      });
      if (result.error) throw providerError(result.error);
      if (!result.data) throw new DataAccessError('provider-failure', 'The snapshot could not be stored.');
      return mapSnapshot(result.data);
    },

    async deleteOwnedCloudData(_userId: string) {
      const result = await client.rpc('delete_my_cloud_data', {});
      if (result.error) throw providerError(result.error);
    },
  };
}
