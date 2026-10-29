const { spawnSync } = require("node:child_process");

const composeFile = "docker-compose.local.yml";
const databaseUrl = process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("docker", ["compose", "-f", composeFile, "up", "-d", "postgres"]);

let ready = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  const result = spawnSync("docker", [
    "compose",
    "-f",
    composeFile,
    "exec",
    "-T",
    "postgres",
    "pg_isready",
    "-U",
    "tt_app",
    "-d",
    "tt_rocket_stars",
  ], { stdio: "ignore" });

  if (result.status === 0) {
    ready = true;
    break;
  }

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}

if (!ready) {
  console.error("Local PostgreSQL did not become ready within 30 seconds.");
  process.exit(1);
}

run("npx", ["drizzle-kit", "migrate"]);
run(process.execPath, ["--test", "tests/integration/database.test.cjs"]);
