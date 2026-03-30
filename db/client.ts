import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/db/schema";

declare global {
  var __postgresClient__: Sql | undefined;
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it in your .env file.");
  }

  const client =
    global.__postgresClient__ ??
    postgres(connectionString, {
      prepare: false,
    });

  if (process.env.NODE_ENV !== "production") {
    global.__postgresClient__ = client;
  }

  return drizzle(client, { schema });
}
