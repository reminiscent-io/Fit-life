import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Connect lazily to avoid top-level await issues with build
let connected = false;
async function ensureConnected() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
}

// Connect immediately but handle it async
ensureConnected().catch(console.error);

export const db = drizzle({ client, schema, casing: "snake_case" });
