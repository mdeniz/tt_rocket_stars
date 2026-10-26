export type Language = 'en' | 'es';
export type CrewStatus = 'active' | 'archived';
export type MembershipRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'active' | 'revoked';
export type AccessLevel = 'read' | 'write';
export type AccessContext = 'school' | 'family';

export interface AuthenticatedRequestContext {
  readonly userId: string;
  readonly accessToken: string;
}

export interface PilotRecord {
  readonly id: string;
  readonly userId: string;
  readonly localId: string;
  readonly name: string;
  readonly avatar: string | null;
  readonly language: Language;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProgressSnapshotRecord {
  readonly id: string;
  readonly userId: string;
  readonly pilotId: string;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CrewRecord {
  readonly id: string;
  readonly ownerUserId: string;
  readonly name: string;
  readonly status: CrewStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CrewMembershipRecord {
  readonly id: string;
  readonly crewId: string;
  readonly userId: string;
  readonly role: MembershipRole;
  readonly status: MembershipStatus;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PilotAccessGrant {
  readonly id: string;
  readonly crewId: string;
  readonly pilotId: string;
  readonly userId: string;
  readonly accessLevel: AccessLevel;
  readonly accessContext: AccessContext;
  readonly status: MembershipStatus;
  readonly expiresAt: string | null;
  readonly grantedByUserId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SnapshotWrite {
  readonly pilotId: string;
  readonly expectedVersion: number;
  readonly payload: Record<string, unknown>;
}

export interface PilotQuery {
  readonly localId: string;
}

export interface TypedDataAccess {
  listOwnedPilots(context: AuthenticatedRequestContext): Promise<readonly PilotRecord[]>;
  readOwnedPilot(context: AuthenticatedRequestContext, query: PilotQuery): Promise<PilotRecord | null>;
  readGrantedPilot(context: AuthenticatedRequestContext, pilotId: string): Promise<PilotRecord | null>;
  listCrewMemberships(context: AuthenticatedRequestContext): Promise<readonly CrewMembershipRecord[]>;
  listPilotAccess(context: AuthenticatedRequestContext, pilotId: string): Promise<readonly PilotAccessGrant[]>;
  writeProgressSnapshot(context: AuthenticatedRequestContext, write: SnapshotWrite): Promise<ProgressSnapshotRecord>;
  deleteOwnedCloudData(context: AuthenticatedRequestContext): Promise<void>;
}

export class DataAccessError extends Error {
  readonly code: 'invalid-request' | 'unauthorized' | 'not-found' | 'conflict' | 'provider-failure';

  constructor(code: DataAccessError['code'], message: string) {
    super(message);
    this.name = 'DataAccessError';
    this.code = code;
  }
}
