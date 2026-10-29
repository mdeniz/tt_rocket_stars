import type { AuthIdentity } from './contracts.ts';

export interface PilotResource { readonly id: string; readonly accountId: string; readonly name: string }
export interface PilotRepository { findOwnedPilot(identity: AuthIdentity, pilotId: string): Promise<PilotResource | null> }

export function createInMemoryPilotRepository(pilots: readonly PilotResource[]): PilotRepository {
  return { async findOwnedPilot(identity, pilotId) {
    return pilots.find(pilot => pilot.id === pilotId && pilot.accountId === identity.accountId) ?? null;
  } };
}
