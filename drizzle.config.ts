import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./apps/api/src/db/schema.ts",
  out: "./apps/api/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars",
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "public",
  },
});
