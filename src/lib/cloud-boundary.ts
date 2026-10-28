import type { CloudSnapshot, Language, PilotPayload } from './persistence-contracts';

export type CloudBoundaryStatus =
  | 'disabled'
  | 'signed-out'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'uploaded'
  | 'downloaded'
  | 'local-newer'
  | 'listed'
  | 'not-found'
  | 'deleted'
  | 'conflict'
  | 'failed';

export interface CloudPilotSummary {
  localId: string;
  name: string;
  avatar: string | null;
  language: Language;
  payload?: PilotPayload;
  updatedAt?: string;
}

export interface CloudBoundaryResult {
  status: CloudBoundaryStatus | string;
  snapshot?: CloudSnapshot;
  pilots?: readonly CloudPilotSummary[];
  error?: unknown;
}

/**
 * Browser-facing domain operations. Provider tables, RPC names, and query
 * builders deliberately do not appear in this contract.
 */
export interface BrowserCloudBoundary {
  isAvailable?(): boolean;
  cancel?(): void;
  upload(): Promise<CloudBoundaryResult>;
  download(): Promise<CloudBoundaryResult>;
  listPilots(): Promise<CloudBoundaryResult>;
  restorePilot(localId: string): Promise<CloudBoundaryResult>;
  deleteCloudData(): Promise<CloudBoundaryResult>;
  queueUpload(delay?: number): Promise<CloudBoundaryResult>;
}
