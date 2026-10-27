const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.join(__dirname, '../../supabase/migrations/20261023000000_initial_cloud_progress.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const concurrencyMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261023010000_optimistic_cloud_snapshots.sql'), 'utf8');
const hardeningMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261023020000_harden_cloud_access.sql'), 'utf8');
const crewMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261023030000_crew_access_model.sql'), 'utf8');
const cloudRpcMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261027150000_cloud_access_rpcs.sql'), 'utf8');
const snapshotLockMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261027145301_bound_snapshot_lock_wait.sql'), 'utf8');
const schemaDocs = fs.readFileSync(path.join(__dirname, '../../docs/supabase-schema.md'), 'utf8');

test('cloud schema defines user-owned pilot and versioned progress tables', () => {
  assert.match(migration, /create table if not exists public\.pilots/i);
  assert.match(migration, /create table if not exists public\.progress_snapshots/i);
  assert.match(migration, /user_id uuid not null references auth\.users/i);
  assert.match(migration, /version bigint not null default 1 check \(version > 0\)/i);
  assert.match(migration, /foreign key \(pilot_id, user_id\) references public\.pilots \(id, user_id\)/i);
  assert.match(migration, /payload jsonb not null default '\{\}'::jsonb/i);
});

test('every cloud table enables RLS and has authenticated ownership policies', () => {
  assert.match(migration, /alter table public\.pilots enable row level security/i);
  assert.match(migration, /alter table public\.progress_snapshots enable row level security/i);
  assert.equal((migration.match(/to authenticated/gi) || []).length >= 8, true);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /exists \(\s*select 1 from public\.pilots/i);
});

test('account deletion is authenticated and cannot expose a service role key', () => {
  assert.match(migration, /create or replace function public\.delete_my_cloud_data\(\)/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /grant execute on function public\.delete_my_cloud_data\(\) to authenticated/i);
  assert.doesNotMatch(migration, /service[_ -]?role|supabase_service_role/i);
  assert.match(schemaDocs, /does not delete local browser storage/i);
});

test('snapshot writes enforce authenticated optimistic concurrency', () => {
  assert.match(concurrencyMigration, /upsert_my_progress_snapshot/i);
  assert.match(concurrencyMigration, /p_expected_version bigint/i);
  assert.match(concurrencyMigration, /snapshot version conflict/i);
  assert.match(concurrencyMigration, /grant execute on function public\.upsert_my_progress_snapshot/i);
  assert.doesNotMatch(concurrencyMigration, /service[_ -]?role|supabase_service_role/i);
});

test('hardening migration removes anonymous access and direct snapshot mutations', () => {
  assert.match(hardeningMigration, /revoke all on table public\.pilots from anon/i);
  assert.match(hardeningMigration, /revoke all on table public\.progress_snapshots from anon/i);
  assert.match(hardeningMigration, /revoke insert, update, delete on table public\.progress_snapshots from authenticated/i);
  assert.match(hardeningMigration, /grant execute on function public\.delete_my_cloud_data\(\) to authenticated/i);
  assert.match(hardeningMigration, /grant execute on function public\.upsert_my_progress_snapshot\(uuid, bigint, jsonb\) to authenticated/i);
  assert.doesNotMatch(hardeningMigration, /service[_ -]?role|supabase_service_role/i);
});

test('cloud access RPCs bind reads and writes to the authenticated account', () => {
  assert.match(cloudRpcMigration, /create or replace function public\.upsert_my_pilot/i);
  assert.match(cloudRpcMigration, /create or replace function public\.list_my_pilots/i);
  assert.match(cloudRpcMigration, /create or replace function public\.read_my_pilot/i);
  assert.match(cloudRpcMigration, /create or replace function public\.read_my_progress_snapshot/i);
  assert.equal((cloudRpcMigration.match(/select auth\.uid\(\)/gi) || []).length >= 4, true);
  assert.match(cloudRpcMigration, /grant execute on function public\.list_my_pilots\(\) to authenticated/i);
  assert.match(cloudRpcMigration, /revoke all on function public\.upsert_my_pilot/i);
  assert.doesNotMatch(cloudRpcMigration, /service[_ -]?role|supabase_service_role/i);
});

test('snapshot writes fail fast when another transaction owns the row lock', () => {
  assert.match(snapshotLockMigration, /create or replace function public\.upsert_my_progress_snapshot/i);
  assert.match(snapshotLockMigration, /for update nowait/i);
  assert.match(snapshotLockMigration, /when lock_not_available/i);
  assert.match(snapshotLockMigration, /cloud snapshot is busy/i);
  assert.doesNotMatch(snapshotLockMigration, /service[_ -]?role|supabase_service_role/i);
});

test('crew access schema keeps pilot identity global and explicit', () => {
  assert.match(crewMigration, /add column if not exists management_mode text not null default 'personal'/i);
  assert.match(crewMigration, /create table if not exists public\.crews/i);
  assert.match(crewMigration, /create table if not exists public\.crew_memberships/i);
  assert.match(crewMigration, /create table if not exists public\.pilot_access/i);
  assert.match(crewMigration, /unique \(crew_id, pilot_id, user_id\)/i);
  assert.match(crewMigration, /access_context text not null check \(access_context in \('school', 'family'\)\)/i);
});

test('crew access schema denies anonymous reads and separates membership from pilot grants', () => {
  assert.match(crewMigration, /revoke all on table public\.crews from anon, authenticated/i);
  assert.match(crewMigration, /revoke all on table public\.crew_memberships from anon, authenticated/i);
  assert.match(crewMigration, /revoke all on table public\.pilot_access from anon, authenticated/i);
  assert.match(crewMigration, /grant select on table public\.crews to authenticated/i);
  assert.match(crewMigration, /grant select on table public\.crew_memberships to authenticated/i);
  assert.match(crewMigration, /grant select on table public\.pilot_access to authenticated/i);
  assert.match(crewMigration, /Users can read explicitly granted pilot access/i);
  assert.match(crewMigration, /is_active_crew_member\(id\)/i);
  assert.match(crewMigration, /status = 'active'[\s\S]*is_active_crew_member\(crew_id\)/i);
  assert.match(crewMigration, /expires_at is null or expires_at > timezone\('utc', now\(\)\)/i);
  assert.match(crewMigration, /status = 'active'/i);
  assert.doesNotMatch(crewMigration, /service[_ -]?role|supabase_service_role/i);
});

test('crew schema documentation states ownership, access, and migration boundaries', () => {
  assert.match(schemaDocs, /Private crew access contract/i);
  assert.match(schemaDocs, /Membership is independently status-controlled/i);
  assert.match(schemaDocs, /membership alone/i);
  assert.match(schemaDocs, /20261023030000_crew_access_model\.sql/i);
  assert.match(schemaDocs, /issue #56/i);
});
