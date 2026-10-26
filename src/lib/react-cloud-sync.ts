import type { CloudSnapshot, Language, PilotPayload } from './persistence-contracts';

export type CloudSyncStatus = 'disabled' | 'signed-out' | 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface CloudPilotSummary {
  localId: string;
  name: string;
  avatar: string | null;
  language: Language;
  payload?: PilotPayload;
  updatedAt?: string;
}

export interface CloudSyncResult {
  status: string;
  snapshot?: CloudSnapshot;
  pilots?: CloudPilotSummary[];
  error?: unknown;
}

export interface LegacyCloudSyncAdapter {
  upload(): Promise<CloudSyncResult>;
  download(): Promise<CloudSyncResult>;
  listRemotePilots(): Promise<CloudSyncResult>;
  downloadPilot(localId: string): Promise<CloudSyncResult>;
  queueUpload(delay?: number): Promise<CloudSyncResult>;
}

export interface ReactCloudSyncBoundary {
  isAvailable(): boolean;
  upload(): Promise<CloudSyncResult>;
  download(): Promise<CloudSyncResult>;
  listPilots(): Promise<CloudSyncResult>;
  restorePilot(localId: string): Promise<CloudSyncResult>;
  queueUpload(delay?: number): Promise<CloudSyncResult>;
}

const disabled = (status: 'disabled' | 'signed-out' = 'disabled'): CloudSyncResult => ({ status });

function safeCall<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return Promise.resolve(operation()).catch(() => fallback);
  } catch {
    return Promise.resolve(fallback);
  }
}

/**
 * Exposes the legacy cloud runtime through a typed, fail-closed React boundary.
 * The resolver is evaluated per call so module/classic-script ordering cannot
 * make cloud access a prerequisite for local gameplay.
 */
export function createReactCloudSyncBoundary(resolve: () => LegacyCloudSyncAdapter | undefined = () => undefined): ReactCloudSyncBoundary {
  const adapter = (): LegacyCloudSyncAdapter | undefined => {
    try { return resolve(); } catch { return undefined; }
  };
  return Object.freeze({
    isAvailable: () => Boolean(adapter()),
    upload: () => {
      const cloud = adapter();
      return cloud ? safeCall(() => cloud.upload(), { status: 'failed' }) : Promise.resolve(disabled());
    },
    download: () => {
      const cloud = adapter();
      return cloud ? safeCall(() => cloud.download(), { status: 'failed' }) : Promise.resolve(disabled());
    },
    listPilots: () => {
      const cloud = adapter();
      return cloud ? safeCall(() => cloud.listRemotePilots(), { status: 'failed', pilots: [] }) : Promise.resolve({ status: 'disabled', pilots: [] });
    },
    restorePilot: (localId: string) => {
      if (!localId.trim()) return Promise.resolve({ status: 'not-found' });
      const cloud = adapter();
      return cloud ? safeCall(() => cloud.downloadPilot(localId), { status: 'failed' }) : Promise.resolve(disabled());
    },
    queueUpload: (delay?: number) => {
      const cloud = adapter();
      return cloud ? safeCall(() => cloud.queueUpload(delay), { status: 'failed' }) : Promise.resolve(disabled());
    },
  });
}
