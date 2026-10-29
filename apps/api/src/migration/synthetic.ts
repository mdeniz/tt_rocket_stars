type JsonRecord = Record<string, unknown>;
type DateLike = string | null | undefined;

export interface SyntheticBundle {
  source: 'supabase-synthetic-v1';
  accounts: SyntheticAccount[];
  pilots: SyntheticPilot[];
  progressSnapshots: SyntheticProgressSnapshot[];
  crews: SyntheticCrew[];
  crewMemberships: SyntheticCrewMembership[];
  pilotAccess: SyntheticPilotAccess[];
}

interface SyntheticAccount { id: string; email?: string | null; displayName?: string | null; status?: 'active' | 'suspended' | 'deleted'; }
interface SyntheticPilot { id: string; accountId: string; localId: string; name: string; avatar: string; language?: 'en' | 'es'; managementMode?: 'private' | 'crew'; payload?: JsonRecord; createdAt?: DateLike; updatedAt?: DateLike; }
interface SyntheticProgressSnapshot { id: string; accountId: string; pilotId: string; version: number; payload: JsonRecord; createdAt?: DateLike; updatedAt?: DateLike; }
interface SyntheticCrew { id: string; ownerAccountId: string; name: string; createdAt?: DateLike; updatedAt?: DateLike; }
interface SyntheticCrewMembership { crewId: string; accountId: string; role?: 'owner' | 'admin' | 'member'; createdAt?: DateLike; updatedAt?: DateLike; }
interface SyntheticPilotAccess { pilotId: string; accountId: string; grantedByAccountId: string; createdAt?: DateLike; updatedAt?: DateLike; }

export interface MigrationPackage {
  format: 'tt-rocket-stars.synthetic-migration.v1';
  generatedAt: string;
  source: SyntheticBundle['source'];
  idMap: { accounts: Record<string, string>; pilots: Record<string, string>; snapshots: Record<string, string>; crews: Record<string, string> };
  tables: {
    accounts: JsonRecord[];
    pilots: JsonRecord[];
    progressSnapshots: JsonRecord[];
    crews: JsonRecord[];
    crewMemberships: JsonRecord[];
    pilotAccess: JsonRecord[];
  };
  manifest: { counts: Record<string, number>; checksums: Record<string, string>; packageSha256: string };
}

const allowedFields: Record<keyof SyntheticBundle, readonly string[]> = {
  source: ['source'],
  accounts: ['id', 'email', 'displayName', 'status'],
  pilots: ['id', 'accountId', 'localId', 'name', 'avatar', 'language', 'managementMode', 'payload', 'createdAt', 'updatedAt'],
  progressSnapshots: ['id', 'accountId', 'pilotId', 'version', 'payload', 'createdAt', 'updatedAt'],
  crews: ['id', 'ownerAccountId', 'name', 'createdAt', 'updatedAt'],
  crewMemberships: ['crewId', 'accountId', 'role', 'createdAt', 'updatedAt'],
  pilotAccess: ['pilotId', 'accountId', 'grantedByAccountId', 'createdAt', 'updatedAt'],
};

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value as JsonRecord).sort().map(key => `${JSON.stringify(key)}:${canonical((value as JsonRecord)[key])}`).join(',')}}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function stableUuid(namespace: string, sourceId: string): Promise<string> {
  const hash = await sha256(`${namespace}:${sourceId}`);
  const bytes = new Uint8Array(hash.match(/.{2}/g)!.slice(0, 16).map(value => Number.parseInt(value, 16)));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function stableAccountId(sourceId: string): Promise<string> { return `migrated_${(await sha256(`account:${sourceId}`)).slice(0, 40)}`; }

function fail(message: string): never { throw new Error(`Synthetic migration validation failed: ${message}`); }

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
}

function validateFields(value: JsonRecord, allowed: readonly string[], label: string): void {
  for (const field of Object.keys(value)) if (!allowed.includes(field)) fail(`${label} contains a disallowed field.`);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} must be a non-empty string.`);
  return value;
}

function list<T>(value: unknown, key: keyof SyntheticBundle): T[] {
  if (!Array.isArray(value)) fail(`${key} must be an array.`);
  return value.map((entry, index) => {
    assertRecord(entry, `${key}[${index}]`);
    validateFields(entry, allowedFields[key], `${key}[${index}]`);
    return entry as T;
  });
}

function sorted<T extends JsonRecord>(rows: T[], key: keyof T): T[] {
  return [...rows].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
}

function dateOrNull(value: unknown, label: string): string | null {
  if (value === undefined || value === null) return null;
  const result = requiredString(value, label);
  if (Number.isNaN(Date.parse(result))) fail(`${label} must be an ISO date.`);
  return new Date(result).toISOString();
}

export async function exportSyntheticBundle(input: unknown, generatedAt = '2000-01-01T00:00:00.000Z'): Promise<MigrationPackage> {
  assertRecord(input, 'bundle');
  validateFields(input, Object.keys(allowedFields), 'bundle');
  if (input.source !== 'supabase-synthetic-v1') fail('source must be supabase-synthetic-v1.');
  const accounts = list<SyntheticAccount>(input.accounts, 'accounts');
  const pilots = list<SyntheticPilot>(input.pilots, 'pilots');
  const snapshots = list<SyntheticProgressSnapshot>(input.progressSnapshots, 'progressSnapshots');
  const crews = list<SyntheticCrew>(input.crews, 'crews');
  const memberships = list<SyntheticCrewMembership>(input.crewMemberships, 'crewMemberships');
  const access = list<SyntheticPilotAccess>(input.pilotAccess, 'pilotAccess');
  const accountIds = new Set(accounts.map(row => requiredString(row.id, 'accounts.id')));
  const pilotIds = new Set(pilots.map(row => requiredString(row.id, 'pilots.id')));
  const crewIds = new Set(crews.map(row => requiredString(row.id, 'crews.id')));
  const idMap = {
    accounts: Object.fromEntries(await Promise.all(accounts.map(async row => [row.id, await stableAccountId(row.id)]))),
    pilots: Object.fromEntries(await Promise.all(pilots.map(async row => [row.id, await stableUuid('pilot', row.id)]))),
    snapshots: Object.fromEntries(await Promise.all(snapshots.map(async row => [row.id, await stableUuid('snapshot', row.id)]))),
    crews: Object.fromEntries(await Promise.all(crews.map(async row => [row.id, await stableUuid('crew', row.id)]))),
  };
  for (const row of pilots) {
    requiredString(row.accountId, 'pilots.accountId');
    if (!accountIds.has(row.accountId)) fail('pilots references an unknown account.');
    requiredString(row.localId, 'pilots.localId'); requiredString(row.name, 'pilots.name'); requiredString(row.avatar, 'pilots.avatar');
    if (row.language !== undefined && row.language !== 'en' && row.language !== 'es') fail('pilots.language is invalid.');
    if (row.managementMode !== undefined && row.managementMode !== 'private' && row.managementMode !== 'crew') fail('pilots.managementMode is invalid.');
  }
  for (const row of snapshots) {
    if (!accountIds.has(row.accountId) || !pilotIds.has(row.pilotId)) fail('progressSnapshots references an unknown owner or pilot.');
    if (row.version < 1 || !Number.isInteger(row.version)) fail('progressSnapshots.version must be a positive integer.');
  }
  for (const row of crews) if (!accountIds.has(row.ownerAccountId)) fail('crews references an unknown owner.');
  for (const row of memberships) if (!crewIds.has(row.crewId) || !accountIds.has(row.accountId)) fail('crewMemberships references an unknown crew or account.');
  for (const row of access) if (!pilotIds.has(row.pilotId) || !accountIds.has(row.accountId) || !accountIds.has(row.grantedByAccountId)) fail('pilotAccess references an unknown entity.');
  const tables = {
    accounts: sorted(accounts.map(row => ({ id: idMap.accounts[row.id], email: row.email ?? null, displayName: row.displayName ?? null, status: row.status ?? 'active' })), 'id'),
    pilots: sorted(pilots.map(row => ({ id: idMap.pilots[row.id], accountId: idMap.accounts[row.accountId], localId: row.localId, name: row.name, avatar: row.avatar, language: row.language ?? 'en', managementMode: row.managementMode ?? 'private', payload: row.payload ?? {}, createdAt: dateOrNull(row.createdAt, 'pilots.createdAt'), updatedAt: dateOrNull(row.updatedAt, 'pilots.updatedAt') })), 'id'),
    progressSnapshots: sorted(snapshots.map(row => ({ id: idMap.snapshots[row.id], accountId: idMap.accounts[row.accountId], pilotId: idMap.pilots[row.pilotId], version: row.version, payload: row.payload, createdAt: dateOrNull(row.createdAt, 'progressSnapshots.createdAt'), updatedAt: dateOrNull(row.updatedAt, 'progressSnapshots.updatedAt') })), 'id'),
    crews: sorted(crews.map(row => ({ id: idMap.crews[row.id], ownerAccountId: idMap.accounts[row.ownerAccountId], name: row.name, createdAt: dateOrNull(row.createdAt, 'crews.createdAt'), updatedAt: dateOrNull(row.updatedAt, 'crews.updatedAt') })), 'id'),
    crewMemberships: sorted(memberships.map(row => ({ crewId: idMap.crews[row.crewId], accountId: idMap.accounts[row.accountId], role: row.role ?? 'member', createdAt: dateOrNull(row.createdAt, 'crewMemberships.createdAt'), updatedAt: dateOrNull(row.updatedAt, 'crewMemberships.updatedAt') })), 'crewId'),
    pilotAccess: sorted(access.map(row => ({ pilotId: idMap.pilots[row.pilotId], accountId: idMap.accounts[row.accountId], grantedByAccountId: idMap.accounts[row.grantedByAccountId], createdAt: dateOrNull(row.createdAt, 'pilotAccess.createdAt'), updatedAt: dateOrNull(row.updatedAt, 'pilotAccess.updatedAt') })), 'pilotId'),
  };
  const counts = Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.length]));
  const checksums = Object.fromEntries(await Promise.all(Object.entries(tables).map(async ([key, rows]) => [key, await sha256(canonical(rows))])));
  const withoutManifest = { format: 'tt-rocket-stars.synthetic-migration.v1' as const, generatedAt, source: input.source as SyntheticBundle['source'], idMap, tables };
  return { ...withoutManifest, manifest: { counts, checksums, packageSha256: await sha256(canonical(withoutManifest)) } };
}

export async function packageSha256(value: MigrationPackage): Promise<string> {
  const { manifest: _manifest, ...withoutManifest } = value;
  return sha256(canonical(withoutManifest));
}

export async function validateMigrationPackage(value: unknown): Promise<void> {
  assertRecord(value, 'migration package');
  if (value.format !== 'tt-rocket-stars.synthetic-migration.v1' || !value.tables || !value.manifest) fail('package format is invalid.');
  if (await packageSha256(value as unknown as MigrationPackage) !== (value.manifest as JsonRecord).packageSha256) fail('package checksum does not match.');
}

export async function importMigrationPackage(sql: any, migration: MigrationPackage, options: { dryRun?: boolean; failAfterTable?: string } = {}): Promise<{ status: 'imported' | 'replayed' | 'dry-run'; packageSha256: string }> {
  await validateMigrationPackage(migration);
  if (options.dryRun) return { status: 'dry-run', packageSha256: migration.manifest.packageSha256 };
  return sql.begin(async (tx: any) => {
    const existing = await tx`select package_sha256 from migration_imports where package_sha256 = ${migration.manifest.packageSha256}`;
    if (existing.length > 0) return { status: 'replayed' as const, packageSha256: migration.manifest.packageSha256 };
    const insert = async (table: string, query: () => Promise<unknown>) => { await query(); if (options.failAfterTable === table) throw new Error(`Synthetic migration failure after ${table}.`); };
    for (const row of migration.tables.accounts) await insert('accounts', () => tx`insert into accounts (id, email, display_name, status) values (${row.id}, ${row.email}, ${row.displayName}, ${row.status})`);
    for (const row of migration.tables.pilots) await insert('pilots', () => tx`insert into pilots (id, account_id, local_id, name, avatar, language, management_mode, payload, created_at, updated_at) values (${row.id}, ${row.accountId}, ${row.localId}, ${row.name}, ${row.avatar}, ${row.language}, ${row.managementMode}, ${JSON.stringify(row.payload)}, coalesce(${row.createdAt}, now()), coalesce(${row.updatedAt}, now()))`);
    for (const row of migration.tables.progressSnapshots) await insert('progressSnapshots', () => tx`insert into progress_snapshots (id, account_id, pilot_id, version, payload, created_at, updated_at) values (${row.id}, ${row.accountId}, ${row.pilotId}, ${row.version}, ${JSON.stringify(row.payload)}, coalesce(${row.createdAt}, now()), coalesce(${row.updatedAt}, now()))`);
    for (const row of migration.tables.crews) await insert('crews', () => tx`insert into crews (id, owner_account_id, name, created_at, updated_at) values (${row.id}, ${row.ownerAccountId}, ${row.name}, coalesce(${row.createdAt}, now()), coalesce(${row.updatedAt}, now()))`);
    for (const row of migration.tables.crewMemberships) await insert('crewMemberships', () => tx`insert into crew_memberships (crew_id, account_id, role, created_at, updated_at) values (${row.crewId}, ${row.accountId}, ${row.role}, coalesce(${row.createdAt}, now()), coalesce(${row.updatedAt}, now()))`);
    for (const row of migration.tables.pilotAccess) await insert('pilotAccess', () => tx`insert into pilot_access (pilot_id, account_id, granted_by_account_id, created_at, updated_at) values (${row.pilotId}, ${row.accountId}, ${row.grantedByAccountId}, coalesce(${row.createdAt}, now()), coalesce(${row.updatedAt}, now()))`);
    await tx`insert into migration_imports (package_sha256, manifest) values (${migration.manifest.packageSha256}, ${JSON.stringify(migration.manifest)})`;
    return { status: 'imported' as const, packageSha256: migration.manifest.packageSha256 };
  });
}
