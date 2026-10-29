import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema.ts";

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 5,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}
