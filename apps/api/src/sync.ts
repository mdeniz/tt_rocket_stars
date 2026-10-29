import type { AuthIdentity } from './contracts.ts';
import { ApiError } from './errors.ts';

const MAX_OPERATION_ID_LENGTH = 128;
const MAX_PAYLOAD_BYTES = 256 * 1024;

type Row = Record<string, unknown>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<readonly Row[]>;

export interface SyncDatabase {
  readonly client: { begin<T>(callback: (transaction: SqlTag) => Promise<T>): Promise<T> };
}

export interface ProgressUpload {
  readonly version: 1;
  readonly operationId: string;
  readonly pilotId: string;
  readonly expectedVersion: number;
  readonly payload: Record<string, unknown>;
}

export interface ProgressUploadResult {
  readonly operationId: string;
  readonly pilotId: string;
  readonly version: number;
  readonly replayed: boolean;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${canonicalize((value as Record<string, unknown>)[key])}`).join(',')}}`;
}

function decodeResult(value: unknown): ProgressUploadResult {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return parsed as ProgressUploadResult;
}

async function requestHash(upload: ProgressUpload): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(upload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function parseProgressUpload(input: unknown): ProgressUpload {
  if (!input || typeof input !== 'object') throw new ApiError(400, 'bad_request', 'A valid progress upload is required.');
  const value = input as Record<string, unknown>;
  if (value.version !== 1 || typeof value.operationId !== 'string' || value.operationId.length === 0 || value.operationId.length > MAX_OPERATION_ID_LENGTH) {
    throw new ApiError(400, 'bad_request', 'The progress upload version or operation ID is invalid.');
  }
  if (typeof value.pilotId !== 'string' || value.pilotId.length === 0 || typeof value.expectedVersion !== 'number' || !Number.isSafeInteger(value.expectedVersion) || value.expectedVersion < 0) {
    throw new ApiError(400, 'bad_request', 'The progress upload target or expected version is invalid.');
  }
  if (!value.payload || typeof value.payload !== 'object' || Array.isArray(value.payload)) {
    throw new ApiError(400, 'bad_request', 'The progress payload must be an object.');
  }
  if (byteLength(JSON.stringify(value.payload)) > MAX_PAYLOAD_BYTES) throw new ApiError(400, 'bad_request', 'The progress payload is too large.');
  return {
    version: 1,
    operationId: value.operationId,
    pilotId: value.pilotId,
    expectedVersion: value.expectedVersion,
    payload: value.payload as Record<string, unknown>,
  };
}

export function createSyncService(database: SyncDatabase) {
  return {
    async upload(identity: AuthIdentity, input: unknown): Promise<ProgressUploadResult> {
      const upload = parseProgressUpload(input);
      const hash = await requestHash(upload);
      return database.client.begin(async transaction => {
        const existingOperation = await transaction`
          select operation_id, request_hash, result
          from sync_operations
          where account_id = ${identity.accountId} and operation_id = ${upload.operationId}
          for update
        `;
        if (existingOperation.length > 0) {
          const operation = existingOperation[0];
          if (operation.request_hash !== hash) throw new ApiError(409, 'conflict', 'The operation ID was already used with different content.');
          return { ...decodeResult(operation.result), replayed: true };
        }

        const pilots = await transaction`
          select id from pilots where id = ${upload.pilotId} and account_id = ${identity.accountId} for update
        `;
        if (pilots.length === 0) throw new ApiError(404, 'not_found', 'Pilot not found.');
        const snapshots = await transaction`
          select version from progress_snapshots where pilot_id = ${upload.pilotId} and account_id = ${identity.accountId} for update
        `;
        const currentVersion = snapshots.length === 0 ? 0 : Number(snapshots[0].version);
        if (currentVersion !== upload.expectedVersion) throw new ApiError(409, 'conflict', 'The progress version is stale.');
        const nextVersion = currentVersion + 1;
        const result: ProgressUploadResult = { operationId: upload.operationId, pilotId: upload.pilotId, version: nextVersion, replayed: false };
        if (snapshots.length === 0) {
          await transaction`
            insert into progress_snapshots (account_id, pilot_id, version, payload)
            values (${identity.accountId}, ${upload.pilotId}, ${nextVersion}, ${JSON.stringify(upload.payload)}::jsonb)
          `;
        } else {
          await transaction`
            update progress_snapshots
            set version = ${nextVersion}, payload = ${JSON.stringify(upload.payload)}::jsonb, updated_at = now()
            where account_id = ${identity.accountId} and pilot_id = ${upload.pilotId}
          `;
        }
        await transaction`
          insert into sync_operations (account_id, operation_id, request_hash, result)
          values (${identity.accountId}, ${upload.operationId}, ${hash}, ${JSON.stringify(result)}::jsonb)
        `;
        return result;
      });
    },
  };
}
