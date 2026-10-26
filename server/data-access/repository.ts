import {
  DataAccessError,
  type AuthenticatedRequestContext,
  type PilotQuery,
  type SnapshotWrite,
  type TypedDataAccess,
} from './contracts.ts';
import type { DataAccessProvider, ProviderFactory } from './provider.ts';

function requireContext(context: AuthenticatedRequestContext): void {
  if (!context || !context.userId.trim() || !context.accessToken.trim()) {
    throw new DataAccessError('unauthorized', 'An authenticated request context is required.');
  }
}

function requireIdentifier(value: string, field: string): string {
  const identifier = String(value || '').trim();
  if (!identifier) throw new DataAccessError('invalid-request', `${field} is required.`);
  return identifier;
}

function requirePayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new DataAccessError('invalid-request', 'A snapshot payload object is required.');
  }
  return payload;
}

function requireSnapshotWrite(write: SnapshotWrite): SnapshotWrite {
  const pilotId = requireIdentifier(write?.pilotId, 'pilotId');
  if (!Number.isSafeInteger(write?.expectedVersion) || write.expectedVersion < 0) {
    throw new DataAccessError('invalid-request', 'expectedVersion must be a non-negative integer.');
  }
  return { pilotId, expectedVersion: write.expectedVersion, payload: requirePayload(write.payload) };
}

async function safely<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DataAccessError) throw error;
    throw new DataAccessError('provider-failure', 'The data provider operation failed.');
  }
}

/**
 * Build the trusted domain repository. The factory receives the authenticated
 * request context so a provider can bind the user token to its transaction.
 */
export function createTypedDataAccess(providerFactory: ProviderFactory): TypedDataAccess {
  const provider = (context: AuthenticatedRequestContext): DataAccessProvider => {
    requireContext(context);
    const provider = providerFactory(context);
    if (!provider) throw new DataAccessError('provider-failure', 'A data provider is unavailable.');
    return provider;
  };

  const access: TypedDataAccess = {
    listOwnedPilots: (context) => safely(() => provider(context).listOwnedPilots(context.userId)),
    readOwnedPilot: (context, query: PilotQuery) => {
      const localId = requireIdentifier(query?.localId, 'localId');
      return safely(() => provider(context).readOwnedPilot(context.userId, localId));
    },
    readGrantedPilot: (context, pilotId) => {
      const id = requireIdentifier(pilotId, 'pilotId');
      return safely(() => provider(context).readGrantedPilot(context.userId, id));
    },
    listCrewMemberships: (context) => safely(() => provider(context).listCrewMemberships(context.userId)),
    listPilotAccess: (context, pilotId) => {
      const id = requireIdentifier(pilotId, 'pilotId');
      return safely(() => provider(context).listPilotAccess(context.userId, id));
    },
    writeProgressSnapshot: (context, write) => {
      const validated = requireSnapshotWrite(write);
      return safely(() => provider(context).writeProgressSnapshot(context.userId, validated));
    },
    deleteOwnedCloudData: (context) => safely(() => provider(context).deleteOwnedCloudData(context.userId)),
  };
  return Object.freeze(access);
}
