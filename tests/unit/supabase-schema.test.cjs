const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.join(__dirname, '../../supabase/migrations/20261023000000_initial_cloud_progress.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const concurrencyMigration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20261023010000_optimistic_cloud_snapshots.sql'), 'utf8');
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
