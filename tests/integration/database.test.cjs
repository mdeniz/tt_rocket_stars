const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars", {
  max: 1,
  prepare: false,
});
const admin = postgres(process.env.DATABASE_ADMIN_URL ?? "postgres://tt_admin:tt_admin_local_only@localhost:54329/tt_rocket_stars", {
  max: 1,
  prepare: false,
});

const accountId = `integration-${randomUUID()}`;
const otherAccountId = `integration-${randomUUID()}`;

test.after(async () => {
  await sql`delete from accounts where id in (${accountId}, ${otherAccountId})`;
  await sql.end({ timeout: 5 });
  await admin.end({ timeout: 5 });
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
