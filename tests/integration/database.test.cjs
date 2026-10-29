const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars", {
  max: 1,
  prepare: false,
});

test("application database role has only least-privilege application table grants", async () => {
  const rows = await sql`
    select table_name, privilege_type
    from information_schema.role_table_grants
    where grantee = 'tt_app'
    order by table_name, privilege_type
  `;
  const allowedTables = new Set(["accounts", "pilots", "progress_snapshots", "sync_operations", "crews", "crew_memberships", "pilot_access", "user", "account", "session", "verification", "migration_imports"]);
  const allowedPrivileges = new Set(["SELECT", "INSERT", "UPDATE", "DELETE"]);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    assert.equal(allowedTables.has(row.table_name), true, `unexpected application grant on ${row.table_name}`);
    assert.equal(allowedPrivileges.has(row.privilege_type), true, `unexpected application privilege ${row.privilege_type}`);
  }
});
const admin = postgres(process.env.DATABASE_ADMIN_URL ?? "postgres://tt_admin:tt_admin_local_only@localhost:54329/tt_rocket_stars", {
  max: 1,
  prepare: false,
});

const accountId = `integration-${randomUUID()}`;
const otherAccountId = `integration-${randomUUID()}`;
const importedPackages = [];

test.after(async () => {
  await sql`delete from accounts where id in (${accountId}, ${otherAccountId})`;
  for (const packageSha256 of importedPackages) await sql`delete from migration_imports where package_sha256 = ${packageSha256}`;
  await sql.end({ timeout: 5 });
  await admin.end({ timeout: 5 });
});

test("synthetic migration imports atomically and replays by package checksum", async () => {
  const { exportSyntheticBundle, importMigrationPackage } = await import("../../apps/api/src/migration/synthetic.ts");
  const sourceAccountId = `synthetic-${randomUUID()}`;
  const sourcePilotId = `synthetic-pilot-${randomUUID()}`;
  const migration = await exportSyntheticBundle({
    source: "supabase-synthetic-v1",
    accounts: [{ id: sourceAccountId, email: `${sourceAccountId}@example.test` }],
    pilots: [{ id: sourcePilotId, accountId: sourceAccountId, localId: "synthetic-pilot", name: "Synthetic Pilot", avatar: "rocket" }],
    progressSnapshots: [],
    crews: [],
    crewMemberships: [],
    pilotAccess: [],
  });
  const imported = await importMigrationPackage(sql, migration);
  importedPackages.push(imported.packageSha256);
  assert.equal(imported.status, "imported");
  assert.equal((await sql`select count(*)::int as count from accounts where id = ${migration.idMap.accounts[sourceAccountId]}`)[0].count, 1);
  assert.equal((await importMigrationPackage(sql, migration)).status, "replayed");
  const failedMigration = await exportSyntheticBundle({
    source: "supabase-synthetic-v1",
    accounts: [{ id: `${sourceAccountId}-rollback`, email: "rollback@example.test" }],
    pilots: [], progressSnapshots: [], crews: [], crewMemberships: [], pilotAccess: [],
  });
  await assert.rejects(importMigrationPackage(sql, failedMigration, { failAfterTable: "accounts" }), /failure after accounts/i);
  assert.equal((await sql`select count(*)::int as count from accounts where id = ${failedMigration.idMap.accounts[`${sourceAccountId}-rollback`]}`)[0].count, 0);
});

test("migration reconciliation verifies ownership, checksums, rollback, and recovery", async () => {
  const { exportSyntheticBundle, importMigrationPackage, reconcileMigrationPackage } = await import("../../apps/api/src/migration/synthetic.ts");
  const suffix = randomUUID();
  const source = {
    accountA: `reconcile-a-${suffix}`,
    accountB: `reconcile-b-${suffix}`,
    pilot: `reconcile-pilot-${suffix}`,
    snapshot: `reconcile-snapshot-${suffix}`,
    crew: `reconcile-crew-${suffix}`,
  };
  const timestamp = "2024-01-02T03:04:05.000Z";
  const migration = await exportSyntheticBundle({
    source: "supabase-synthetic-v1",
    accounts: [
      { id: source.accountA, email: `${source.accountA}@example.test` },
      { id: source.accountB, email: `${source.accountB}@example.test` },
    ],
    pilots: [{ id: source.pilot, accountId: source.accountA, localId: "reconcile-pilot", name: "Reconcile Pilot", avatar: "rocket", createdAt: timestamp, updatedAt: timestamp }],
    progressSnapshots: [{ id: source.snapshot, accountId: source.accountA, pilotId: source.pilot, version: 3, payload: { coins: 7 }, createdAt: timestamp, updatedAt: timestamp }],
    crews: [{ id: source.crew, ownerAccountId: source.accountA, name: "Reconcile Crew", createdAt: timestamp, updatedAt: timestamp }],
    crewMemberships: [{ crewId: source.crew, accountId: source.accountB, role: "member", createdAt: timestamp, updatedAt: timestamp }],
    pilotAccess: [{ pilotId: source.pilot, accountId: source.accountB, grantedByAccountId: source.accountA, createdAt: timestamp, updatedAt: timestamp }],
  });

  await assert.rejects(
    exportSyntheticBundle({
      source: "supabase-synthetic-v1",
      accounts: [{ id: "owner" }],
      pilots: [{ id: "pilot", accountId: "owner", localId: "pilot", name: "Pilot", avatar: "rocket" }],
      progressSnapshots: [{ id: "snapshot", accountId: "owner", pilotId: "pilot", version: 1, payload: {} }],
      crews: [{ id: "crew", ownerAccountId: "missing", name: "Crew" }],
      crewMemberships: [], pilotAccess: [],
    }),
    /unknown owner/i,
  );

  await importMigrationPackage(sql, migration);
  importedPackages.push(migration.manifest.packageSha256);
  const reconciled = await reconcileMigrationPackage(sql, migration);
  assert.equal(reconciled.passed, true);
  assert.equal(reconciled.ownershipValidated, true);
  assert.deepEqual(reconciled.mismatches, []);

  const corrupted = structuredClone(migration);
  corrupted.tables.progressSnapshots[0].version = 4;
  await assert.rejects(importMigrationPackage(sql, corrupted), /checksum does not match/i);

  const rollback = await exportSyntheticBundle({
    source: "supabase-synthetic-v1",
    accounts: [{ id: `${source.accountA}-rollback` }],
    pilots: [], progressSnapshots: [], crews: [], crewMemberships: [], pilotAccess: [],
  });
  await assert.rejects(importMigrationPackage(sql, rollback, { failAfterTable: "accounts" }), /failure after accounts/i);
  assert.equal((await sql`select count(*)::int as count from accounts where id = ${rollback.idMap.accounts[`${source.accountA}-rollback`]}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from migration_imports where package_sha256 = ${rollback.manifest.packageSha256}`)[0].count, 0);
  assert.equal((await importMigrationPackage(sql, rollback)).status, "imported");
  importedPackages.push(rollback.manifest.packageSha256);
  assert.equal((await importMigrationPackage(sql, rollback)).status, "replayed");
});

test("clean-room migration creates the tenant and future crew tables", async () => {
  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('accounts', 'pilots', 'progress_snapshots', 'sync_operations', 'crews', 'crew_memberships', 'pilot_access')
    order by table_name
  `;

  assert.deepEqual(rows.map((row) => row.table_name), [
    "accounts",
    "crew_memberships",
    "crews",
    "pilot_access",
    "pilots",
    "progress_snapshots",
    "sync_operations",
  ]);
});

test("composite tenant foreign keys prevent cross-account snapshots", async () => {
  const pilotId = randomUUID();
  await sql`
    insert into accounts (id, email) values (${accountId}, ${`${accountId}@example.test`}), (${otherAccountId}, ${`${otherAccountId}@example.test`})
  `;
  await sql`
    insert into pilots (id, account_id, local_id, name, avatar, payload)
    values (${pilotId}, ${accountId}, 'local-pilot', 'Test Pilot', 'rocket', '{}')
  `;

  await assert.rejects(
    sql`
      insert into progress_snapshots (account_id, pilot_id, version, payload)
      values (${otherAccountId}, ${pilotId}, 1, '{}')
    `,
    (error) => error.code === "23503",
  );
});

test("idempotency keys are unique per account and versions are positive", async () => {
  const pilotId = randomUUID();
  await sql`
    insert into pilots (id, account_id, local_id, name, avatar, payload)
    values (${pilotId}, ${accountId}, 'version-pilot', 'Version Pilot', 'rocket', '{}')
  `;
  await sql`
    insert into sync_operations (account_id, operation_id, request_hash, result)
    values (${accountId}, 'operation-1', 'hash-1', '{}')
  `;

  await assert.rejects(
    sql`
      insert into sync_operations (account_id, operation_id, request_hash, result)
      values (${accountId}, 'operation-1', 'hash-1', '{}')
    `,
    (error) => error.code === "23505",
  );

  await assert.rejects(
    sql`
      insert into progress_snapshots (account_id, pilot_id, version, payload)
      values (${accountId}, ${pilotId}, 0, '{}')
    `,
    (error) => error.code === "23514",
  );
});

test("a failed transaction rolls back all writes", async () => {
  const rollbackAccountId = `integration-${randomUUID()}`;

  await assert.rejects(
    sql.begin(async (transaction) => {
      await transaction`insert into accounts (id, email) values (${rollbackAccountId}, ${`${rollbackAccountId}@example.test`})`;
      throw new Error("intentional rollback");
    }),
    /intentional rollback/,
  );

  const rows = await sql`select id from accounts where id = ${rollbackAccountId}`;
  assert.equal(rows.length, 0);
});

test("the application role is not privileged", async () => {
  const rows = await admin`
    select rolsuper, rolcreatedb, rolcreaterole
    from pg_roles
    where rolname = 'tt_app'
  `;

  assert.equal(rows.length, 1);
  assert.deepEqual({ ...rows[0] }, { rolsuper: false, rolcreatedb: false, rolcreaterole: false });
});
