const test = require("node:test");
const assert = require("node:assert/strict");
const postgres = require("postgres");

const databaseUrl = process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars";
const env = {
  environment: "test",
  corsOrigins: ["http://localhost:5173"],
  logLevel: "info",
  authSecret: "local-integration-secret-that-is-long-enough-123",
  authBaseUrl: "http://localhost:8787",
  localInvitationCode: "local-test-invitation",
};

test("Better Auth persists local users and sessions in PostgreSQL", async () => {
  const [{ createApi }, { createAuthService }, { createDatabase }] = await Promise.all([
    import("../../apps/api/src/app.ts"),
    import("../../apps/api/src/auth.ts"),
    import("../../apps/api/src/db/client.ts"),
  ]);
  const database = createDatabase(databaseUrl);
  const auth = createAuthService(env, database.db);
  const app = createApi(env, { auth, authDatabase: database.db });
  const invite = await app.request("http://localhost/api/v1/auth/local/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify({ email: "database@example.test", name: "Database Pilot", password: "correct-horse-battery-staple", invitationCode: env.localInvitationCode }),
  });
  assert.equal(invite.status, 201);
  const sql = postgres(databaseUrl, { prepare: false });
  const rows = await sql`select id, email from "user" where email = ${"database@example.test"}`;
  assert.deepEqual(rows.map(row => row.email), ["database@example.test"]);
  const signIn = await app.request("http://localhost/api/v1/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173", "X-Forwarded-For": "192.0.2.20" },
    body: JSON.stringify({ email: "database@example.test", password: "correct-horse-battery-staple" }),
  });
  assert.equal(signIn.status, 200);
  const sessions = await sql`select user_id from "session" where user_id = ${rows[0].id}`;
  assert.equal(sessions.length, 1);
  await sql`delete from "user" where email = ${"database@example.test"}`;
  await sql.end({ timeout: 5 });
  await database.client.end({ timeout: 5 });
});
