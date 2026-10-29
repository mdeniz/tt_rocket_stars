const postgres = require("postgres");

const admin = postgres(process.env.DATABASE_ADMIN_URL ?? "postgres://tt_admin:tt_admin_local_only@localhost:54329/tt_rocket_stars", {
  max: 1,
  prepare: false,
});

const applicationTables = [
  "accounts",
  "pilots",
  "progress_snapshots",
  "sync_operations",
  "crews",
  "crew_memberships",
  "pilot_access",
];

(async () => {
  await admin`grant usage on schema public to tt_app`;
  for (const table of applicationTables) {
    await admin.unsafe(`grant select, insert, update, delete on table public.${table} to tt_app`);
  }
  await admin`alter default privileges for role tt_migrator in schema public grant select, insert, update, delete on tables to tt_app`;
  await admin`alter default privileges for role tt_migrator in schema public grant usage, select on sequences to tt_app`;
})().finally(() => admin.end({ timeout: 5 }));
