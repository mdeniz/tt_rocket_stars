const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { writeFileSync, readFileSync, unlinkSync } = require("node:fs");
const postgres = require("postgres");

const compose = ["compose", "-f", "docker-compose.local.yml"];
const adminUrl = process.env.DATABASE_ADMIN_URL ?? "postgres://tt_admin:tt_admin_local_only@localhost:54329/tt_rocket_stars";
const runtimeUrl = process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars";
const restoreDatabase = `tt_restore_${randomUUID().replaceAll("-", "")}`;
const dumpPath = `/tmp/tt-rocket-stars-${randomUUID()}.dump`;

function run(args, options = {}) {
  const result = spawnSync("docker", [...compose, ...args], { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

function capture(args) {
  const result = spawnSync("docker", [...compose, ...args], { encoding: null });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? Buffer.alloc(0));
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

run(["up", "-d", "postgres"]);
for (let attempt = 0; attempt < 30; attempt += 1) {
  const ready = spawnSync("docker", [...compose, "exec", "-T", "postgres", "pg_isready", "-U", "tt_admin", "-d", "tt_rocket_stars"], {
    stdio: "ignore",
  });
  if (ready.status === 0) break;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  if (attempt === 29) throw new Error("Local PostgreSQL did not become ready");
}

const sql = postgres(runtimeUrl, { max: 1, prepare: false });
const admin = postgres(adminUrl, { max: 1, prepare: false });

(async () => {
  const sentinel = `backup-restore-${randomUUID()}`;
  await sql`insert into accounts (id, email) values (${sentinel}, ${`${sentinel}@example.test`})`;
  writeFileSync(dumpPath, capture(["exec", "-T", "postgres", "pg_dump", "-Fc", "-U", "tt_admin", "-d", "tt_rocket_stars"]));

  await admin.unsafe(`create database ${restoreDatabase} owner tt_admin`);
  run(["exec", "-T", "postgres", "pg_restore", "--no-owner", "--exit-on-error", "-U", "tt_admin", "-d", restoreDatabase], {
    stdio: ["pipe", "inherit", "inherit"],
    input: readFileSync(dumpPath),
  });

  const restored = postgres(`${adminUrl.replace(/\/tt_rocket_stars$/, `/${restoreDatabase}`)}`, { max: 1, prepare: false });
  const rows = await restored`select id from accounts where id = ${sentinel}`;
  if (rows.length !== 1) throw new Error("Backup/restore drill did not restore the sentinel account");
  await restored.end({ timeout: 5 });
  console.log(`Backup/restore drill passed for ${restoreDatabase}`);
})().finally(async () => {
  await sql.end({ timeout: 5 });
  await admin.unsafe(`drop database if exists ${restoreDatabase}`);
  await admin.end({ timeout: 5 });
  unlinkSync(dumpPath);
});
