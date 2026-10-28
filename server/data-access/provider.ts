import type {
  AuthenticatedRequestContext,
  CrewMembershipRecord,
  PilotAccessGrant,
  PilotRecord,
  PilotWrite,
  ProgressSnapshotRecord,
  SnapshotWrite,
} from './contracts.ts';

/**
 * Provider-neutral operations required by the domain repository.
 * Implementations may use Supabase, Drizzle, or another PostgreSQL adapter, but
 * must keep account and grant constraints in the provider transaction.
 */
export interface DataAccessProvider {
  upsertOwnedPilot(userId: string, pilot: PilotWrite): Promise<PilotRecord>;
  listOwnedPilots(userId: string): Promise<readonly PilotRecord[]>;
  readOwnedPilot(userId: string, localId: string): Promise<PilotRecord | null>;
  readProgressSnapshot(userId: string, pilotId: string): Promise<ProgressSnapshotRecord | null>;
  readGrantedPilot(userId: string, pilotId: string): Promise<PilotRecord | null>;
  listCrewMemberships(userId: string): Promise<readonly CrewMembershipRecord[]>;
  listPilotAccess(userId: string, pilotId: string): Promise<readonly PilotAccessGrant[]>;
  writeProgressSnapshot(userId: string, write: SnapshotWrite): Promise<ProgressSnapshotRecord>;
  writeOwnedPilotSnapshot(userId: string, pilot: PilotWrite, expectedVersion: number): Promise<ProgressSnapshotRecord>;
  deleteOwnedCloudData(userId: string): Promise<void>;
}

export type ProviderFactory = (context: AuthenticatedRequestContext) => DataAccessProvider;
